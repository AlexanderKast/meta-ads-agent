"use client";

import { useState } from "react";
import type { AdVariation, Platform } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface AdRefineProps {
  variation: AdVariation;
  platform: Platform;
  onRefine: (refined: AdVariation) => void;
}

export function AdRefine({ variation, platform, onRefine }: AdRefineProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleRefine() {
    if (!instruction.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original: variation, instruction, platform }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al refinar");
      }

      const refined: AdVariation = await res.json();
      onRefine(refined);
      setInstruction("");
      setOpen(false);
    } catch {
      // silently fail for now
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-text-dim hover:text-primary transition-colors"
      >
        Refinar
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Hazlo mas corto, cambia el CTA..."
        className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder-text-dim focus:outline-none focus:border-primary"
        onKeyDown={(e) => e.key === "Enter" && handleRefine()}
      />
      <Button size="sm" loading={loading} onClick={handleRefine}>
        OK
      </Button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-text-dim hover:text-text-primary px-2"
      >
        X
      </button>
    </div>
  );
}
