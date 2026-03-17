"use client";

import type { Language } from "@/lib/types";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">Idioma</label>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(LANGUAGES) as [Language, string][]).map(([key, label]) => (
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
