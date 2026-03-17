"use client";

import type { Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">Plataforma</label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(PLATFORMS) as [Platform, (typeof PLATFORMS)[Platform]][]).map(
          ([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "p-3 rounded-xl border text-left text-sm transition-all",
                value === key
                  ? "border-primary bg-primary-light text-text-primary"
                  : "border-border bg-surface text-text-muted hover:border-border-hover"
              )}
            >
              <span className="text-lg">{val.icon}</span>
              <span className="ml-2">{val.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
