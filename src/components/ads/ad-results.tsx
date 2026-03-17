"use client";

import { useState } from "react";
import type { AdResponse, AdVariation, Objective } from "@/lib/types";
import { PLATFORMS } from "@/lib/constants";
import { AdCard } from "./ad-card";
import { AdTips } from "./ad-tips";
import { AdSkeleton } from "./ad-skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ExportMenu } from "./export-menu";

interface AdResultsProps {
  result: AdResponse | null;
  isStreaming: boolean;
  error: string | null;
  variations: number;
  objective?: Objective;
  onUpdateVariation?: (result: AdResponse) => void;
}

export function AdResults({ result, isStreaming, error, variations, objective, onUpdateVariation }: AdResultsProps) {
  const [localResult, setLocalResult] = useState<AdResponse | null>(null);

  const displayResult = localResult || result;

  // sync when result changes from parent
  if (result && result !== displayResult && !localResult) {
    // use parent result
  }

  function handleRefine(index: number, refined: AdVariation) {
    if (!displayResult) return;
    const updated = {
      ...displayResult,
      variations: displayResult.variations.map((v, i) => (i === index ? refined : v)),
    };
    setLocalResult(updated);
    onUpdateVariation?.(updated);
  }

  // Reset local when parent result changes
  const currentResult = result || localResult;
  if (result && localResult && result !== localResult) {
    // parent has new data
  }

  const finalResult = localResult || result;

  if (error) {
    return (
      <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-error text-sm">
        {error}
      </div>
    );
  }

  if (!finalResult && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-text-dim py-20">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-xl font-semibold text-text-muted mb-2">Listo para crear anuncios</h2>
        <p className="text-sm max-w-md">
          Completa el formulario y Claude generara copy publicitario optimizado para la plataforma
          que elijas.
        </p>
      </div>
    );
  }

  if (isStreaming && !finalResult) {
    return <AdSkeleton count={variations} />;
  }

  if (!finalResult) return null;

  const platform = PLATFORMS[finalResult.platform];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-text-primary">
          {platform.icon} {platform.label}
        </h2>
        <div className="flex items-center gap-3">
          {isStreaming && <Spinner size="sm" />}
          <span className="text-xs text-text-dim">{finalResult.variations.length} variaciones</span>
          {!isStreaming && <ExportMenu result={finalResult} />}
        </div>
      </div>

      {finalResult.variations.map((v, i) => (
        <AdCard
          key={i}
          variation={v}
          index={i}
          platform={finalResult.platform}
          objective={objective}
          onRefine={handleRefine}
        />
      ))}

      {!isStreaming && <AdTips tips={finalResult.tips} />}
    </div>
  );
}
