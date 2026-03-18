"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  message: string;
  severity: "warning" | "critical" | "info";
  created_at: string;
  read: boolean;
}

const severityStyles: Record<string, { badge: "warning" | "info" | "default"; border: string; icon: string }> = {
  warning: { badge: "warning", border: "border-l-warning", icon: "\u26A0\uFE0F" },
  critical: { badge: "default", border: "border-l-error", icon: "\uD83D\uDEA8" },
  info: { badge: "info", border: "border-l-info", icon: "\u2139\uFE0F" },
};

export function AlertsWidget({ className }: { className?: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAsRead = async (id: string) => {
    await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  return (
    <Card variant="bordered" className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Alertas</h3>
        {unreadCount > 0 && (
          <Badge variant="warning">{unreadCount} sin leer</Badge>
        )}
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <span className="text-2xl mb-2">{"\u2705"}</span>
          <p className="text-xs text-text-dim">No hay alertas activas</p>
        </div>
      ) : (
        <ScrollArea className="h-56">
          <div className="space-y-2 pr-3">
            {alerts.map((alert) => {
              const style = severityStyles[alert.severity] || severityStyles.info;
              return (
                <button
                  key={alert.id}
                  onClick={() => !alert.read && markAsRead(alert.id)}
                  className={cn(
                    "w-full text-left rounded-lg border-l-4 px-3 py-2.5 text-xs transition-all",
                    style.border,
                    alert.read
                      ? "bg-transparent text-text-dim opacity-60"
                      : "bg-surface text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-xs mt-0.5">{style.icon}</span>
                      <span className="flex-1 leading-relaxed">{alert.message}</span>
                    </div>
                    <Badge variant={style.badge} className="shrink-0 text-[10px]">
                      {alert.severity}
                    </Badge>
                  </div>
                  <span className="text-text-dim mt-1.5 block text-[10px] pl-5">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
