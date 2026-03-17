"use client";

import { useState, useEffect, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { CreativeCard } from "@/components/library/creative-card";
import { cn } from "@/lib/utils";

interface Creative {
  id: string;
  platform: string;
  headline: string;
  primaryText: string;
  cta: string;
  hook: string;
  status: string;
  createdAt: string;
  generationId: string;
  variationIndex: number;
}

const platforms = [
  { value: "", label: "Todas" },
  { value: "meta", label: "Meta" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitter", label: "X / Twitter" },
  { value: "microsoft", label: "Microsoft" },
];

const statuses = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicado" },
];

export default function LibraryPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchCreatives = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (platformFilter) params.set("platform", platformFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/creatives?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar creativos");

      setCreatives(data.creatives || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [platformFilter, statusFilter]);

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  const handlePublish = async (id: string) => {
    const creative = creatives.find((c) => c.id === id);
    if (!creative) return;

    try {
      const res = await fetch("/api/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationId: creative.generationId,
          variationIndex: creative.variationIndex,
          status: "published",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al publicar");
      }

      // Update local state
      setCreatives((prev) =>
        prev.map((c) =>
          c.generationId === creative.generationId
            ? { ...c, status: "published" }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Creative Library
        </h1>
        <p className="text-text-muted mb-8">
          Todos tus anuncios generados en un solo lugar
        </p>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex gap-1">
            {platforms.map((p) => (
              <button
                key={p.value}
                onClick={() => setPlatformFilter(p.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  platformFilter === p.value
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-text-muted hover:text-text-secondary hover:bg-surface"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="h-6 w-px bg-border self-center" />
          <div className="flex gap-1">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  statusFilter === s.value
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-text-muted hover:text-text-secondary hover:bg-surface"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-text-muted text-sm">Cargando creativos...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && creatives.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
              <span className="text-2xl text-text-muted">+</span>
            </div>
            <p className="text-text-muted text-sm text-center">
              Genera tu primer anuncio para verlo aqui
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (window.location.href = "/")}
            >
              Crear anuncio
            </Button>
          </div>
        )}

        {/* Creative Grid */}
        {!loading && creatives.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatives.map((creative) => (
              <CreativeCard
                key={creative.id}
                id={creative.id}
                platform={creative.platform}
                headline={creative.headline}
                primaryText={creative.primaryText}
                cta={creative.cta}
                hook={creative.hook}
                status={creative.status}
                createdAt={creative.createdAt}
                onPublish={handlePublish}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
