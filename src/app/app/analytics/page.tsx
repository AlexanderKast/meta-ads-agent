"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { PlatformComparison, type PlatformMetric } from "@/components/analytics/platform-comparison";
import { KpiTable, type AnalyticsMetrics } from "@/components/analytics/kpi-table";
import { TrendChart, type DailyPlatformData } from "@/components/analytics/trend-chart";
import { useAccount } from "@/contexts/account-context";

const PLATFORM_ICONS: Record<string, string> = {
  meta: "\uD83D\uDCD8",
  google: "\uD83D\uDD0D",
  tiktok: "\uD83C\uDFB5",
  linkedin: "\uD83D\uDCBC",
};

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

interface ApiResponse {
  byPlatform: PlatformMetric[];
  daily: DailyPlatformData[];
  totals: AnalyticsMetrics & { revenue: number; conversions: number };
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-800 rounded-lg ${className || ""}`} />;
}

function fmt(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(0);
}

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedAccountId } = useAccount();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - rangeDays);
      const startDate = start.toISOString().split("T")[0];
      const endDate = end.toISOString().split("T")[0];

      const params = new URLSearchParams({ startDate, endDate });
      if (selectedAccountId) params.set("accountId", selectedAccountId);

      const res = await fetch(`/api/analytics/cross-platform?${params}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [rangeDays, selectedAccountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const platforms = data?.byPlatform.map((p) => p.platform) || [];
  const isEmpty = !loading && (!data || data.byPlatform.length === 0);

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header + Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted">
            Cross-platform performance overview.
          </p>
        </div>
        <div className="flex gap-2">
          {DATE_RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                rangeDays === r.days
                  ? "bg-primary text-white font-medium"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-20" />
            ))}
          </div>
          <SkeletonBlock className="h-64" />
          <SkeletonBlock className="h-80" />
          <SkeletonBlock className="h-48" />
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <Card variant="bordered" className="text-center py-12">
          <div className="text-4xl mb-3">{"\uD83D\uDCC8"}</div>
          <p className="text-text-dim">
            Conecta plataformas y crea campanas para ver analytics
          </p>
        </Card>
      )}

      {/* Data loaded */}
      {!loading && data && data.byPlatform.length > 0 && (
        <>
          {/* Overview KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card variant="bordered" className="space-y-1">
              <span className="text-xs text-text-dim">Total Spend</span>
              <p className="text-2xl font-bold text-text-primary">
                ${fmt(data.totals.spend)}
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <span className="text-xs text-text-dim">Impressions</span>
              <p className="text-2xl font-bold text-text-primary">
                {fmt(data.totals.impressions)}
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <span className="text-xs text-text-dim">Clicks</span>
              <p className="text-2xl font-bold text-text-primary">
                {fmt(data.totals.clicks)}
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <span className="text-xs text-text-dim">CTR</span>
              <p className="text-2xl font-bold text-text-primary">
                {data.totals.ctr.toFixed(2)}%
              </p>
            </Card>
            <Card variant="bordered" className="space-y-1">
              <span className="text-xs text-text-dim">ROAS</span>
              <p className="text-2xl font-bold text-text-primary">
                {data.totals.roas.toFixed(2)}x
              </p>
            </Card>
          </div>

          {/* Platform Comparison */}
          <Card variant="bordered" className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-text-primary">
                Platform Comparison
              </h2>
              <div className="flex gap-1">
                {platforms.map((p) => (
                  <span key={p} title={p} className="text-sm">
                    {PLATFORM_ICONS[p] || "\uD83D\uDCE2"}
                  </span>
                ))}
              </div>
            </div>
            <PlatformComparison data={data.byPlatform} />
          </Card>

          {/* Trend Chart */}
          <Card variant="bordered" className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Performance Trends
            </h2>
            <TrendChart data={data.daily} platforms={platforms} />
          </Card>

          {/* KPI Health Table */}
          <Card variant="bordered" className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">
              KPI Health
            </h2>
            <KpiTable metrics={data.totals} />
          </Card>
        </>
      )}
    </div>
  );
}
