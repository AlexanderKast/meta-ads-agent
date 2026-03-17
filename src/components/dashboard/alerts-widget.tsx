"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  message: string;
  severity: "warning" | "critical" | "info";
  created_at: string;
  read: boolean;
}

const severityStyles: Record<string, { badge: "warning" | "info" | "default"; border: string }> = {
  warning: { badge: "warning", border: "border-l-warning" },
  critical: { badge: "default", border: "border-l-error" },
  info: { badge: "info", border: "border-l-info" },
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
        <h3 className="text-sm font-semibold text-text-primary">Alerts</h3>
        {unreadCount > 0 && (
          <Badge variant="warning">{unreadCount} unread</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-xs text-text-dim py-2">No alerts</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((alert) => {
            const style = severityStyles[alert.severity] || severityStyles.info;
            return (
              <button
                key={alert.id}
                onClick={() => !alert.read && markAsRead(alert.id)}
                className={cn(
                  "w-full text-left rounded-lg border-l-4 px-3 py-2 text-xs transition-colors",
                  style.border,
                  alert.read
                    ? "bg-transparent text-text-dim"
                    : "bg-surface-hover text-text-secondary hover:bg-surface"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1">{alert.message}</span>
                  <Badge variant={style.badge} className="shrink-0 text-[10px]">
                    {alert.severity}
                  </Badge>
                </div>
                <span className="text-text-dim mt-1 block">
                  {new Date(alert.created_at).toLocaleDateString()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
