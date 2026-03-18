"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsIcon, RotateCcwIcon } from "lucide-react";
import {
  ALL_METRICS,
  DEFAULT_VISIBLE_METRICS,
  type MetricCategory,
} from "@/components/dashboard/kpi-cards";

/* ------------------------------------------------------------------ */
/*  Storage                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "dashboard-metrics-config";

export function loadMetricsConfig(): string[] {
  if (typeof window === "undefined") return DEFAULT_VISIBLE_METRICS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_VISIBLE_METRICS;
}

export function saveMetricsConfig(keys: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Category grouping                                                  */
/* ------------------------------------------------------------------ */

const CATEGORIES: MetricCategory[] = [
  "Gasto",
  "Alcance",
  "Clicks",
  "Conversiones",
  "Eficiencia",
];

const categoryColors: Record<MetricCategory, string> = {
  Gasto: "text-orange-400",
  Alcance: "text-blue-400",
  Clicks: "text-pink-400",
  Conversiones: "text-green-400",
  Eficiencia: "text-purple-400",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface MetricsConfigModalProps {
  visibleMetrics: string[];
  onChange: (metrics: string[]) => void;
}

export function MetricsConfigModal({
  visibleMetrics,
  onChange,
}: MetricsConfigModalProps) {
  const [localVisible, setLocalVisible] = useState<Set<string>>(
    () => new Set(visibleMetrics)
  );
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<MetricCategory, typeof ALL_METRICS>();
    for (const cat of CATEGORIES) {
      map.set(
        cat,
        ALL_METRICS.filter((m) => m.category === cat)
      );
    }
    return map;
  }, []);

  const toggle = (key: string) => {
    setLocalVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = () => {
    const keys = ALL_METRICS.filter((m) => localVisible.has(m.key)).map(
      (m) => m.key
    );
    saveMetricsConfig(keys);
    onChange(keys);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalVisible(new Set(DEFAULT_VISIBLE_METRICS));
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalVisible(new Set(visibleMetrics));
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <SettingsIcon className="w-3.5 h-3.5 mr-1.5" data-icon="inline-start" />
            Personalizar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Personalizar Metricas</DialogTitle>
          <DialogDescription className="text-[#9ca3af]">
            Selecciona las metricas que quieres ver en el dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto -mx-4 px-4 space-y-5 py-2">
          {CATEGORIES.map((cat) => {
            const metrics = grouped.get(cat) || [];
            return (
              <div key={cat}>
                <h4
                  className={cn(
                    "text-[11px] uppercase tracking-wider font-semibold mb-2",
                    categoryColors[cat]
                  )}
                >
                  {cat}
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {metrics.map((m) => {
                    const active = localVisible.has(m.key);
                    return (
                      <button
                        key={m.key}
                        onClick={() => toggle(m.key)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border",
                          active
                            ? "bg-white/[0.08] border-white/10 text-white"
                            : "bg-transparent border-transparent text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.03]"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                            active
                              ? "bg-orange-500 border-orange-500"
                              : "border-[#4b5563] bg-transparent"
                          )}
                        >
                          {active && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="truncate">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="bg-gray-900/80 border-white/[0.06]">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-[#9ca3af]">
            <RotateCcwIcon className="w-3.5 h-3.5 mr-1.5" data-icon="inline-start" />
            Restaurar defaults
          </Button>
          <Button size="sm" onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
