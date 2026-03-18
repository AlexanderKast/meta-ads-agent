"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreativeCardProps {
  id: string;
  platform: string;
  headline: string;
  primaryText: string;
  cta: string;
  hook: string;
  status: string;
  createdAt: string;
  onPublish?: (id: string) => void;
}

const platformIcons: Record<string, string> = {
  meta: "M",
  tiktok: "T",
  google: "G",
  youtube: "Y",
  linkedin: "L",
  pinterest: "P",
  twitter: "X",
  microsoft: "B",
};

const platformColors: Record<string, string> = {
  meta: "bg-blue-500/20 text-blue-400",
  tiktok: "bg-pink-500/20 text-pink-400",
  google: "bg-green-500/20 text-green-400",
  youtube: "bg-red-500/20 text-red-400",
  linkedin: "bg-sky-500/20 text-sky-400",
  pinterest: "bg-rose-500/20 text-rose-400",
  twitter: "bg-gray-500/20 text-gray-400",
  microsoft: "bg-cyan-500/20 text-cyan-400",
};

export function CreativeCard({
  id,
  platform,
  headline,
  primaryText,
  cta,
  hook,
  status,
  createdAt,
  onPublish,
}: CreativeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const fullText = [
      headline && `Headline: ${headline}`,
      primaryText && `Primary Text: ${primaryText}`,
      cta && `CTA: ${cta}`,
      hook && `Hook: ${hook}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      variant="bordered"
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/5",
        expanded && "ring-1 ring-primary/30"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
              platformColors[platform] || "bg-gray-500/20 text-gray-400"
            )}
          >
            {platformIcons[platform] || "?"}
          </span>
          <span className="text-xs text-text-muted capitalize">{platform}</span>
        </div>
        <Badge variant={status === "published" ? "success" : "default"}>
          {status === "published" ? "Publicado" : "Borrador"}
        </Badge>
      </div>

      {/* Headline */}
      <h3
        className={cn(
          "font-semibold text-text-primary mb-2",
          !expanded && "line-clamp-1"
        )}
      >
        {headline || "Sin titulo"}
      </h3>

      {/* Primary Text */}
      <p
        className={cn(
          "text-sm text-text-secondary mb-3",
          !expanded && "line-clamp-2"
        )}
      >
        {primaryText || "Sin texto principal"}
      </p>

      {/* CTA Badge */}
      {cta && (
        <Badge variant="info" className="mb-3">
          {cta}
        </Badge>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {hook && (
            <div>
              <span className="text-xs text-text-muted block mb-1">Hook</span>
              <p className="text-sm text-text-secondary">{hook}</p>
            </div>
          )}
          <div className="text-xs text-text-muted">
            Creado: {new Date(createdAt).toLocaleDateString("es")}
          </div>

          {/* Actions */}
          <div
            className="flex gap-2 mt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copiado!" : "Copiar"}
            </Button>
            {status !== "published" && onPublish && (
              <Button size="sm" variant="default" onClick={() => onPublish(id)}>
                Publicar
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
