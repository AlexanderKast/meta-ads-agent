"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { BellIcon } from "lucide-react";

interface Alert {
  id: string;
  message: string;
  severity: "warning" | "critical" | "info";
  created_at: string;
  read: boolean;
}

const severityStyles: Record<string, { badge: "warning" | "info" | "default"; border: string; icon: string }> = {
  warning: { badge: "warning", border: "border-l-yellow-500/60", icon: "\u26A0\uFE0F" },
  critical: { badge: "default", border: "border-l-red-500/60", icon: "\uD83D\uDEA8" },
  info: { badge: "info", border: "border-l-blue-500/60", icon: "\u2139\uFE0F" },
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
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-[#9ca3af]" />
          <h3 className="text-sm font-semibold text-white">Alertas</h3>
        </div>
        {unreadCount > 0 && (
          <Badge variant="warning">{unreadCount} sin leer</Badge>
        )}
      </div>

      <div className="h-px bg-white/[0.06] -mx-5 mb-4" />

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
            <span className="text-green-400 text-lg">{"\u2713"}</span>
          </div>
          <p className="text-xs text-[#6b7280]">No hay alertas activas</p>
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
                    "w-full text-left rounded-xl border-l-[3px] px-3 py-3 text-xs transition-all",
                    style.border,
                    alert.read
                      ? "bg-transparent text-[#6b7280] opacity-50"
                      : "bg-white/[0.03] text-[#d1d5db] hover:bg-white/[0.06]"
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
                  <span className="text-[#6b7280] mt-1.5 block text-[10px] pl-5">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
