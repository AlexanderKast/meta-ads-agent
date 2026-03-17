"use client";

import { useState } from "react";
import type { AdVariation, Platform, Objective } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCopy } from "@/hooks/use-copy";
import { AdRefine } from "./ad-refine";
import { AdScore } from "./ad-score";
import { AdPublisher } from "./ad-publisher";

const PUBLISHABLE_PLATFORMS = new Set(["meta", "google", "tiktok", "linkedin"]);

interface AdCardProps {
  variation: AdVariation;
  index: number;
  platform?: Platform;
  objective?: Objective;
  onRefine?: (index: number, refined: AdVariation) => void;
}

function formatVariation(v: AdVariation): string {
  return [
    `HEADLINE: ${v.headline}`,
    `PRIMARY TEXT: ${v.primaryText}`,
    v.description ? `DESCRIPTION: ${v.description}` : "",
    `CTA: ${v.cta}`,
    v.hook ? `HOOK: ${v.hook}` : "",
    v.imagePrompt ? `IMAGE PROMPT: ${v.imagePrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function AdCard({ variation, index, platform, objective, onRefine }: AdCardProps) {
  const { copy, copied } = useCopy();
  const [publisherOpen, setPublisherOpen] = useState(false);
  const canPublish = platform && PUBLISHABLE_PLATFORMS.has(platform);

  return (
    <Card variant="bordered" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-primary font-medium">Variacion {index + 1}</span>
        <div className="flex items-center gap-2">
          {platform && objective && (
            <AdScore variation={variation} platform={platform} objective={objective} />
          )}
          <button
            onClick={() => copy(formatVariation(variation))}
            className="text-xs text-text-dim hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-hover"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {variation.hook && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Hook</span>
          <p className="text-warning text-sm font-medium">{variation.hook}</p>
        </div>
      )}

      <div>
        <span className="text-[10px] uppercase tracking-wider text-text-dim">Headline</span>
        <p className="text-text-primary font-semibold">{variation.headline}</p>
      </div>

      <div>
        <span className="text-[10px] uppercase tracking-wider text-text-dim">Primary Text</span>
        <p className="text-text-secondary text-sm whitespace-pre-line">{variation.primaryText}</p>
      </div>

      {variation.description && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Description</span>
          <p className="text-text-muted text-sm">{variation.description}</p>
        </div>
      )}

      {variation.imagePrompt && (
        <div>
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Image Prompt</span>
          <p className="text-info/80 text-xs bg-info/5 rounded-lg p-2">{variation.imagePrompt}</p>
        </div>
      )}

      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
        <Badge>CTA: {variation.cta}</Badge>
        <div className="flex items-center gap-2">
          {platform && onRefine && (
            <AdRefine
              variation={variation}
              platform={platform}
              onRefine={(refined) => onRefine(index, refined)}
            />
          )}
          {canPublish && (
            <button
              onClick={() => setPublisherOpen(true)}
              className="text-xs text-primary hover:text-primary-hover transition-colors px-2 py-1 rounded-lg hover:bg-primary/10 font-medium"
            >
              Publicar
            </button>
          )}
        </div>
      </div>

      {canPublish && (
        <AdPublisher
          variation={variation}
          platform={platform}
          isOpen={publisherOpen}
          onClose={() => setPublisherOpen(false)}
        />
      )}
    </Card>
  );
}
