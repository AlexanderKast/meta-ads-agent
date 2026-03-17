"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Tab = "audit" | "budget" | "copy-test";

interface AuditCampaign {
  name: string;
  healthScore: number;
  issues: string[];
  action: string;
  priority: string;
}

interface AuditResult {
  campaigns: AuditCampaign[];
  summary: string;
  topActions: string[];
}

interface BudgetRecommendation {
  campaign: string;
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
}

interface BudgetResult {
  recommendations: BudgetRecommendation[];
  totalSavings: number;
  projectedROAS: number;
}

interface CopyVariation {
  headline: string;
  primaryText: string;
  cta: string;
  hook: string;
  reasoning: string;
}

interface CopyTestResult {
  patterns: {
    winners: string[];
    losers: string[];
  };
  newVariations: CopyVariation[];
}

export default function StrategyPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [budgetResult, setBudgetResult] = useState<BudgetResult | null>(null);
  const [copyTestResult, setCopyTestResult] = useState<CopyTestResult | null>(
    null
  );

  const runStrategy = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/strategy/${endpoint}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la solicitud");

      if (endpoint === "audit") setAuditResult(data);
      else if (endpoint === "budget") setBudgetResult(data);
      else if (endpoint === "copy-test") setCopyTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "audit", label: "Audit" },
    { key: "budget", label: "Budget" },
    { key: "copy-test", label: "Copy Test" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Strategy AI
        </h1>
        <p className="text-text-muted mb-8">
          Analisis inteligente de tu portafolio publicitario
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5">
            <p className="text-red-400 text-sm">{error}</p>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-text-muted text-sm">
              Analizando con IA... esto puede tomar unos segundos
            </p>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === "audit" && !loading && (
          <div>
            <Button
              onClick={() => runStrategy("audit")}
              className="mb-6"
              loading={loading}
            >
              Ejecutar Audit
            </Button>

            {auditResult && (
              <div className="space-y-6">
                {/* Summary */}
                <Card>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Resumen
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {auditResult.summary}
                  </p>
                </Card>

                {/* Top Actions */}
                <Card>
                  <h3 className="font-semibold text-text-primary mb-3">
                    Top Acciones
                  </h3>
                  <ol className="space-y-2">
                    {auditResult.topActions.map((action, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-text-secondary"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ol>
                </Card>

                {/* Campaign Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {auditResult.campaigns.map((campaign, i) => (
                    <Card key={i} variant="bordered">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-text-primary text-sm">
                          {campaign.name}
                        </h4>
                        <div
                          className={cn(
                            "text-lg font-bold",
                            campaign.healthScore >= 80
                              ? "text-green-400"
                              : campaign.healthScore >= 50
                                ? "text-yellow-400"
                                : "text-red-400"
                          )}
                        >
                          {campaign.healthScore}
                        </div>
                      </div>

                      {/* Health bar */}
                      <div className="w-full h-2 bg-gray-800 rounded-full mb-3">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            campaign.healthScore >= 80
                              ? "bg-green-400"
                              : campaign.healthScore >= 50
                                ? "bg-yellow-400"
                                : "bg-red-400"
                          )}
                          style={{
                            width: `${Math.min(100, campaign.healthScore)}%`,
                          }}
                        />
                      </div>

                      {/* Issues */}
                      {campaign.issues.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-text-muted block mb-1">
                            Problemas
                          </span>
                          <ul className="space-y-1">
                            {campaign.issues.map((issue, j) => (
                              <li
                                key={j}
                                className="text-xs text-text-secondary flex items-start gap-1"
                              >
                                <span className="text-red-400 mt-0.5">
                                  &bull;
                                </span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action */}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary">
                          {campaign.action}
                        </p>
                        <Badge
                          variant={
                            campaign.priority === "alta"
                              ? "warning"
                              : campaign.priority === "media"
                                ? "info"
                                : "default"
                          }
                        >
                          {campaign.priority}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === "budget" && !loading && (
          <div>
            <Button
              onClick={() => runStrategy("budget")}
              className="mb-6"
              loading={loading}
            >
              Optimizar Budget
            </Button>

            {budgetResult && (
              <div className="space-y-6">
                {/* Summary metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <span className="text-xs text-text-muted block mb-1">
                      Ahorro Estimado
                    </span>
                    <span className="text-2xl font-bold text-green-400">
                      ${budgetResult.totalSavings.toFixed(2)}
                    </span>
                  </Card>
                  <Card>
                    <span className="text-xs text-text-muted block mb-1">
                      ROAS Proyectado
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {budgetResult.projectedROAS.toFixed(2)}x
                    </span>
                  </Card>
                </div>

                {/* Recommendations table */}
                <Card>
                  <h3 className="font-semibold text-text-primary mb-4">
                    Recomendaciones
                  </h3>
                  <div className="space-y-4">
                    {budgetResult.recommendations.map((rec, i) => {
                      const diff =
                        rec.recommendedBudget - rec.currentBudget;
                      const isIncrease = diff > 0;
                      return (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-text-primary text-sm">
                              {rec.campaign}
                            </span>
                            <p className="text-xs text-text-muted mt-1">
                              {rec.reason}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-text-muted">
                              ${rec.currentBudget.toFixed(0)}
                            </div>
                            <span
                              className={cn(
                                "font-medium",
                                isIncrease
                                  ? "text-green-400"
                                  : "text-red-400"
                              )}
                            >
                              {isIncrease ? "+" : ""}
                              {diff.toFixed(0)}
                            </span>
                            <div className="font-semibold text-text-primary">
                              ${rec.recommendedBudget.toFixed(0)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Copy Test Tab */}
        {activeTab === "copy-test" && !loading && (
          <div>
            <Button
              onClick={() => runStrategy("copy-test")}
              className="mb-6"
              loading={loading}
            >
              Analizar Copies
            </Button>

            {copyTestResult && (
              <div className="space-y-6">
                {/* Patterns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <h3 className="font-semibold text-green-400 mb-3">
                      Patrones Ganadores
                    </h3>
                    <ul className="space-y-2">
                      {copyTestResult.patterns.winners.map((p, i) => (
                        <li
                          key={i}
                          className="text-sm text-text-secondary flex items-start gap-2"
                        >
                          <span className="text-green-400 mt-0.5">+</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card>
                    <h3 className="font-semibold text-red-400 mb-3">
                      Patrones Perdedores
                    </h3>
                    <ul className="space-y-2">
                      {copyTestResult.patterns.losers.map((p, i) => (
                        <li
                          key={i}
                          className="text-sm text-text-secondary flex items-start gap-2"
                        >
                          <span className="text-red-400 mt-0.5">-</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                {/* New Variations */}
                <h3 className="font-semibold text-text-primary">
                  Nuevas Variaciones Generadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {copyTestResult.newVariations.map((v, i) => (
                    <Card key={i} variant="bordered">
                      <Badge variant="info" className="mb-2">
                        Variacion {i + 1}
                      </Badge>
                      <h4 className="font-semibold text-text-primary text-sm mb-2">
                        {v.headline}
                      </h4>
                      <p className="text-xs text-text-secondary mb-2 line-clamp-3">
                        {v.primaryText}
                      </p>
                      {v.hook && (
                        <p className="text-xs text-text-muted italic mb-2">
                          Hook: {v.hook}
                        </p>
                      )}
                      <Badge variant="default" className="mb-3">
                        {v.cta}
                      </Badge>
                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-text-muted">
                          {v.reasoning}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
