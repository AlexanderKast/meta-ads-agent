"use client";

import { useState } from "react";
import type { AdVariation, Platform, Objective, QualityScore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdScoreProps {
  variation: AdVariation;
  platform: Platform;
  objective: Objective;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? "bg-success" : value >= 60 ? "bg-warning" : "bg-error";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-text-dim">{label}</span>
      <div className="flex-1 bg-surface rounded-full h-2">
        <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right text-text-muted">{value}</span>
    </div>
  );
}

export function AdScore({ variation, platform, objective }: AdScoreProps) {
  const [score, setScore] = useState<QualityScore | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchScore() {
    setLoading(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variation, platform, objective }),
      });
      if (res.ok) {
        setScore(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (!score) {
    return (
      <button
        onClick={fetchScore}
        disabled={loading}
        className="text-xs text-text-dim hover:text-info transition-colors disabled:opacity-50"
      >
        {loading ? "Evaluando..." : "Score"}
      </button>
    );
  }

  const overallColor = score.overall >= 80 ? "text-success" : score.overall >= 60 ? "text-warning" : "text-error";

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-secondary">Quality Score</span>
        <span className={cn("text-lg font-bold", overallColor)}>{score.overall}</span>
      </div>
      <ScoreBar label="Claridad" value={score.clarity} />
      <ScoreBar label="Engagement" value={score.engagement} />
      <ScoreBar label="CTA" value={score.ctaRelevance} />
      <ScoreBar label="Plataforma" value={score.platformCompliance} />
      <p className="text-xs text-text-dim italic">{score.summary}</p>
    </div>
  );
}
