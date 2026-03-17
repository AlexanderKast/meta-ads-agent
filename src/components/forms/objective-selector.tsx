"use client";

import type { Objective } from "@/lib/types";
import { OBJECTIVES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ObjectiveSelectorProps {
  value: Objective;
  onChange: (objective: Objective) => void;
}

export function ObjectiveSelector({ value, onChange }: ObjectiveSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">Objetivo</label>
      <div className="space-y-2">
        {(Object.entries(OBJECTIVES) as [Objective, (typeof OBJECTIVES)[Objective]][]).map(
          ([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "w-full p-3 rounded-xl border text-left text-sm transition-all",
                value === key
                  ? "border-primary bg-primary-light text-text-primary"
                  : "border-border bg-surface text-text-muted hover:border-border-hover"
              )}
            >
              <span className="font-medium">{val.label}</span>
              <span className="text-text-dim ml-2">- {val.desc}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
