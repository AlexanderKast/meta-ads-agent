"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AdCard } from "@/components/ads/ad-card";
import type { AdVariation } from "@/lib/types";

interface OptimizeResult {
  analysis: string;
  issues: string[];
  recommendations: string[];
  optimizedVariations: AdVariation[];
}

export default function OptimizePage() {
  const [metrics, setMetrics] = useState("");
  const [adCopy, setAdCopy] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState("");

  async function handleOptimize(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics, adCopy }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al optimizar");
      }

      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI Optimizer</h1>
        <p className="text-sm text-text-muted">
          Pega tus metricas actuales y Claude analizara por que no performa y generara variaciones optimizadas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <form onSubmit={handleOptimize} className="lg:col-span-2 space-y-5">
          <Textarea
            label="Copy actual del anuncio *"
            value={adCopy}
            onChange={(e) => setAdCopy(e.target.value)}
            placeholder="Pega el copy de tu anuncio actual..."
            rows={4}
            required
          />

          <Textarea
            label="Metricas actuales *"
            value={metrics}
            onChange={(e) => setMetrics(e.target.value)}
            placeholder="CTR: 0.8%, CPC: $2.50, Conversiones: 12, ROAS: 1.5x, Impresiones: 50,000..."
            rows={4}
            required
          />

          <Button type="submit" size="lg" loading={loading} className="w-full">
            {loading ? "Analizando..." : "Optimizar con IA"}
          </Button>
        </form>

        <div className="lg:col-span-3">
          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-error text-sm">{error}</div>
          )}

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-dim py-20">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-xl font-semibold text-text-muted mb-2">Optimiza tus anuncios</h2>
              <p className="text-sm max-w-md">
                Comparte tus metricas y copy actual para obtener un diagnostico y variaciones optimizadas.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Card variant="bordered" className="space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">Diagnostico</h3>
                <p className="text-sm text-text-secondary">{result.analysis}</p>
              </Card>

              {result.issues.length > 0 && (
                <Card variant="default" className="space-y-2">
                  <h3 className="text-sm font-semibold text-error">Problemas detectados</h3>
                  {result.issues.map((issue, i) => (
                    <p key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="text-error">!</span> {issue}
                    </p>
                  ))}
                </Card>
              )}

              {result.recommendations.length > 0 && (
                <Card variant="highlighted" className="space-y-2">
                  <h3 className="text-sm font-semibold text-primary">Recomendaciones</h3>
                  {result.recommendations.map((rec, i) => (
                    <p key={i} className="text-sm text-text-secondary flex gap-2">
                      <Badge variant="info">{i + 1}</Badge> {rec}
                    </p>
                  ))}
                </Card>
              )}

              {result.optimizedVariations.length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-text-primary mt-4">Variaciones optimizadas</h3>
                  {result.optimizedVariations.map((v, i) => (
                    <AdCard key={i} variation={v} index={i} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
