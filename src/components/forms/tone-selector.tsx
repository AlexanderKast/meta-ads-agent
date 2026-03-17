"use client";

import type { Tone } from "@/lib/types";
import { TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">Tono</label>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(TONES) as [Tone, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "px-4 py-2 rounded-full border text-sm transition-all",
              value === key
                ? "border-primary bg-primary-light text-text-primary"
                : "border-border bg-surface text-text-muted hover:border-border-hover"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
