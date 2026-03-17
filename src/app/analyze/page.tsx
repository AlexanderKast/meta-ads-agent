"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastContainer } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdCard } from "@/components/ads/ad-card";
import type { Platform, AnalysisResult } from "@/lib/types";
import { PLATFORMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function AnalyzePage() {
  const [adText, setAdText] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [variations, setVariations] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adText,
          platform: platform || undefined,
          variations,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al analizar");
      }

      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Analisis de Competencia</h1>
          <p className="text-sm text-text-muted">
            Pega el texto de un anuncio de la competencia y Claude lo analizara y generara variaciones mejoradas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form onSubmit={handleAnalyze} className="lg:col-span-2 space-y-5">
            <Textarea
              label="Texto del anuncio *"
              value={adText}
              onChange={(e) => setAdText(e.target.value)}
              placeholder="Pega aqui el copy del anuncio que quieres analizar..."
              rows={6}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Plataforma (opcional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(PLATFORMS) as [Platform, (typeof PLATFORMS)[Platform]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlatform(platform === key ? "" : key)}
                      className={cn(
                        "p-2 rounded-xl border text-left text-xs transition-all",
                        platform === key
                          ? "border-primary bg-primary-light text-text-primary"
                          : "border-border bg-surface text-text-muted hover:border-border-hover"
                      )}
                    >
                      <span>{val.icon}</span>
                      <span className="ml-1">{val.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Variaciones mejoradas: {variations}
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Analizando..." : "Analizar Anuncio"}
            </Button>
          </form>

          <div className="lg:col-span-3">
            {error && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-error text-sm">
                {error}
              </div>
            )}

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-text-dim py-20">
                <div className="text-6xl mb-4">🔬</div>
                <h2 className="text-xl font-semibold text-text-muted mb-2">Analiza cualquier anuncio</h2>
                <p className="text-sm max-w-md">
                  Pega el copy de un anuncio de la competencia para obtener un analisis detallado y variaciones mejoradas.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <Card variant="default" className="space-y-3">
                  <h3 className="text-sm font-semibold text-success">Fortalezas</h3>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-text-secondary flex gap-2">
                        <span className="text-success">+</span> {s}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card variant="default" className="space-y-3">
                  <h3 className="text-sm font-semibold text-error">Debilidades</h3>
                  <ul className="space-y-1">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-text-secondary flex gap-2">
                        <span className="text-error">-</span> {w}
                      </li>
                    ))}
                  </ul>
                </Card>

                <div className="flex items-center gap-2 mt-4 mb-2">
                  <h3 className="text-lg font-semibold text-text-primary">Variaciones Mejoradas</h3>
                  <Badge variant="success">{result.improvements.length}</Badge>
                </div>

                {result.improvements.map((v, i) => (
                  <AdCard key={i} variation={v} index={i} />
                ))}

                {result.tips.length > 0 && (
                  <Card variant="highlighted" className="space-y-2">
                    <h3 className="text-sm font-semibold text-primary">Tips de mejora</h3>
                    <ul className="space-y-1">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-text-secondary flex gap-2">
                          <span className="text-primary">*</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
}
