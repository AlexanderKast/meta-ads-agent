"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ToastContainer } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Platform, Objective, ABTestResult } from "@/lib/types";
import { PLATFORMS, OBJECTIVES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ABTestPage() {
  const [variationTexts, setVariationTexts] = useState(["", ""]);
  const [platform, setPlatform] = useState<Platform>("meta");
  const [objective, setObjective] = useState<Objective>("conversion");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ABTestResult | null>(null);
  const [error, setError] = useState("");

  function updateVariation(index: number, value: string) {
    setVariationTexts((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function addVariation() {
    if (variationTexts.length < 5) {
      setVariationTexts((prev) => [...prev, ""]);
    }
  }

  function removeVariation(index: number) {
    if (variationTexts.length > 2) {
      setVariationTexts((prev) => prev.filter((_, i) => i !== index));
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const filled = variationTexts.filter((v) => v.trim());
    if (filled.length < 2) {
      setError("Necesitas al menos 2 variaciones");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ab-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variations: filled,
          platform,
          objective,
          budget: budget || undefined,
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">A/B Testing de Copy</h1>
          <p className="text-sm text-text-muted">
            Compara variaciones de anuncios y obtiene hipotesis de performance antes de gastar presupuesto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <form onSubmit={handleAnalyze} className="lg:col-span-2 space-y-5">
            {variationTexts.map((text, i) => (
              <div key={i} className="relative">
                <Textarea
                  label={`Variacion ${i + 1} *`}
                  value={text}
                  onChange={(e) => updateVariation(i, e.target.value)}
                  placeholder={`Pega o escribe la variacion ${i + 1}...`}
                  rows={3}
                />
                {variationTexts.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeVariation(i)}
                    className="absolute top-0 right-0 text-xs text-text-dim hover:text-error transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}

            {variationTexts.length < 5 && (
              <button
                type="button"
                onClick={addVariation}
                className="w-full p-2 border border-dashed border-border rounded-xl text-sm text-text-dim hover:text-text-secondary hover:border-border-hover transition-all"
              >
                + Agregar variacion
              </button>
            )}

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Plataforma</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(PLATFORMS) as [Platform, (typeof PLATFORMS)[Platform]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlatform(key)}
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
              <label className="block text-sm font-medium text-text-secondary mb-2">Objetivo</label>
              <div className="space-y-2">
                {(Object.entries(OBJECTIVES) as [Objective, (typeof OBJECTIVES)[Objective]][]).map(
                  ([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setObjective(key)}
                      className={cn(
                        "w-full p-2 rounded-xl border text-left text-xs transition-all",
                        objective === key
                          ? "border-primary bg-primary-light text-text-primary"
                          : "border-border bg-surface text-text-muted hover:border-border-hover"
                      )}
                    >
                      <span className="font-medium">{val.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            <Textarea
              label="Presupuesto (opcional)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Ej: $500 USD/dia"
              rows={1}
            />

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {loading ? "Analizando..." : "Analizar A/B Test"}
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
                <div className="text-6xl mb-4">⚖️</div>
                <h2 className="text-xl font-semibold text-text-muted mb-2">Compara tus variaciones</h2>
                <p className="text-sm max-w-md">
                  Ingresa 2 o mas variaciones de copy y obtendras hipotesis de performance, metricas a trackear y duracion recomendada.
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Hypotheses */}
                <h3 className="text-lg font-semibold text-text-primary">Hipotesis</h3>
                {result.hypotheses.map((h, i) => (
                  <Card
                    key={i}
                    variant={h.predictedWinner ? "highlighted" : "bordered"}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">{h.variation}</span>
                      <div className="flex items-center gap-2">
                        {h.predictedWinner && <Badge variant="success">Prediccion: Ganador</Badge>}
                        <Badge variant={h.confidence === "high" ? "success" : h.confidence === "medium" ? "warning" : "info"}>
                          Confianza: {h.confidence}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">{h.hypothesis}</p>
                  </Card>
                ))}

                {/* Metrics */}
                <Card variant="default" className="space-y-3">
                  <h3 className="text-sm font-semibold text-text-primary">Metricas a trackear</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.metricsToTrack.map((m, i) => (
                      <Badge key={i} variant="info">{m}</Badge>
                    ))}
                  </div>
                </Card>

                {/* Duration & Sample */}
                <div className="grid grid-cols-2 gap-4">
                  <Card variant="default" className="space-y-1">
                    <span className="text-xs text-text-dim">Duracion recomendada</span>
                    <p className="text-sm font-medium text-text-primary">{result.recommendedDuration}</p>
                  </Card>
                  <Card variant="default" className="space-y-1">
                    <span className="text-xs text-text-dim">Tamano de muestra</span>
                    <p className="text-sm font-medium text-text-primary">{result.sampleSize}</p>
                  </Card>
                </div>
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
