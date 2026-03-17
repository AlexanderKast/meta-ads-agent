"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface KpiDelta {
  label: string;
  value: string;
  delta: number;
  prefix?: string;
  suffix?: string;
}

interface ReportData {
  id: string;
  type: "daily" | "weekly";
  date_from: string;
  date_to: string;
  metrics: {
    totals: Record<string, number>;
    deltas: Record<string, number>;
    week_average?: Record<string, number>;
    previous_totals?: Record<string, number>;
    by_platform?: Record<string, Record<string, number>>;
    campaign_count?: number;
  };
  ai_analysis: {
    summary?: string;
    highlights?: string[];
    recommendations?: string[];
    risk_areas?: string[];
    trends?: string[];
    platform_breakdown?: Array<{ platform: string; assessment: string }>;
    budget_advice?: string;
    overall_score?: number;
  };
  created_at: string;
}

export function ReportCard({ report }: { report: ReportData }) {
  const [expanded, setExpanded] = useState(false);
  const { type, date_from, date_to, metrics, ai_analysis, created_at } = report;

  const dateLabel =
    type === "daily"
      ? formatDate(date_from)
      : `${formatDate(date_from)} - ${formatDate(date_to)}`;

  const kpis: KpiDelta[] = [
    {
      label: "Impressions",
      value: formatNumber(metrics.totals?.impressions ?? 0),
      delta: metrics.deltas?.impressions ?? 0,
    },
    {
      label: "Clicks",
      value: formatNumber(metrics.totals?.clicks ?? 0),
      delta: metrics.deltas?.clicks ?? 0,
    },
    {
      label: "Spend",
      value: formatCurrency(metrics.totals?.spend ?? 0),
      delta: metrics.deltas?.spend ?? 0,
      prefix: "$",
    },
    {
      label: "Conversions",
      value: formatNumber(metrics.totals?.conversions ?? 0),
      delta: metrics.deltas?.conversions ?? 0,
    },
    {
      label: "Revenue",
      value: formatCurrency(metrics.totals?.revenue ?? 0),
      delta: metrics.deltas?.revenue ?? 0,
      prefix: "$",
    },
    {
      label: "CTR",
      value: (metrics.totals?.ctr ?? 0).toFixed(2),
      delta: metrics.deltas?.ctr ?? 0,
      suffix: "%",
    },
    {
      label: "CPC",
      value: formatCurrency(metrics.totals?.cpc ?? 0),
      delta: metrics.deltas?.cpc ?? 0,
      prefix: "$",
    },
    {
      label: "ROAS",
      value: (metrics.totals?.roas ?? 0).toFixed(2),
      delta: metrics.deltas?.roas ?? 0,
      suffix: "x",
    },
  ];

  const score = ai_analysis?.overall_score ?? 0;

  return (
    <Card variant="bordered" className="cursor-pointer transition-all hover:border-primary/50">
      {/* Header - always visible */}
      <div
        className="flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Badge
            className={
              type === "daily"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-purple-500/20 text-purple-400"
            }
          >
            {type === "daily" ? "Daily" : "Weekly"}
          </Badge>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{dateLabel}</h3>
            <p className="text-xs text-muted mt-0.5">
              Generated {new Date(created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {score > 0 && (
            <div
              className={`text-sm font-bold ${
                score >= 7 ? "text-green-400" : score >= 4 ? "text-yellow-400" : "text-red-400"
              }`}
            >
              {score}/10
            </div>
          )}
          <svg
            className={`w-5 h-5 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Summary - always visible */}
      {ai_analysis?.summary && (
        <p className="text-sm text-muted mt-3 line-clamp-2">{ai_analysis.summary}</p>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-5 border-t border-border pt-4">
          {/* KPI Grid */}
          <div>
            <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
              Key Metrics {type === "daily" ? "(vs 7-day avg)" : "(vs previous week)"}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="bg-background/50 rounded-lg p-3">
                  <p className="text-xs text-muted">{kpi.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {kpi.prefix}{kpi.value}{kpi.suffix}
                  </p>
                  <DeltaIndicator delta={kpi.delta} invertColor={kpi.label === "CPC" || kpi.label === "Spend"} />
                </div>
              ))}
            </div>
          </div>

          {/* AI Highlights */}
          {ai_analysis?.highlights && ai_analysis.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Highlights
              </h4>
              <ul className="space-y-1">
                {ai_analysis.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">+</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trends (weekly) */}
          {ai_analysis?.trends && ai_analysis.trends.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Trends
              </h4>
              <ul className="space-y-1">
                {ai_analysis.trends.map((t, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">&rarr;</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Platform Breakdown (weekly) */}
          {ai_analysis?.platform_breakdown && ai_analysis.platform_breakdown.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Platform Breakdown
              </h4>
              <div className="space-y-2">
                {ai_analysis.platform_breakdown.map((p, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-3">
                    <span className="text-xs font-medium text-primary capitalize">{p.platform}</span>
                    <p className="text-sm text-foreground mt-1">{p.assessment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Areas */}
          {ai_analysis?.risk_areas && ai_analysis.risk_areas.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                Risk Areas
              </h4>
              <ul className="space-y-1">
                {ai_analysis.risk_areas.map((r, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Recommendations */}
          {ai_analysis?.recommendations && ai_analysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                AI Recommendations
              </h4>
              <ul className="space-y-2">
                {ai_analysis.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-foreground bg-primary/5 border border-primary/10 rounded-lg p-3">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Budget Advice (weekly) */}
          {ai_analysis?.budget_advice && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <h4 className="text-xs font-medium text-blue-400 uppercase tracking-wide mb-1">
                Budget Advice
              </h4>
              <p className="text-sm text-foreground">{ai_analysis.budget_advice}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function DeltaIndicator({ delta, invertColor = false }: { delta: number; invertColor?: boolean }) {
  if (delta === 0) {
    return <span className="text-xs text-muted">--</span>;
  }

  const isPositive = delta > 0;
  // For CPC and Spend, positive delta is bad (costs more), negative is good
  const isGood = invertColor ? !isPositive : isPositive;

  return (
    <span className={`text-xs font-medium ${isGood ? "text-green-400" : "text-red-400"}`}>
      {isPositive ? "\u2191" : "\u2193"} {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatCurrency(n: number): string {
  return n.toFixed(2);
}
