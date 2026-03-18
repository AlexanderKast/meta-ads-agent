"use client";

import { useEffect, useState, useCallback } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import type { KPIData, DailyData } from "@/components/dashboard/kpi-cards";
import { LineChartComponent } from "@/components/charts/line-chart";
import { PieChartComponent } from "@/components/charts/pie-chart";
import { BarChartComponent } from "@/components/charts/bar-chart";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import type { Campaign } from "@/components/dashboard/top-campaigns";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import {
  MetricsConfigModal,
  loadMetricsConfig,
} from "@/components/dashboard/metrics-config-modal";
import { useAccount } from "@/contexts/account-context";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlatformData {
  platform: string;
  spend: number;
  impressions: number;
}

interface DashboardData {
  kpis: KPIData;
  daily: DailyData[];
  byPlatform: PlatformData[];
  topCampaigns: Campaign[];
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                          */
/* ------------------------------------------------------------------ */

function KPISkeleton() {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-2"
        >
          <Skeleton className="h-3 w-16 bg-white/[0.06]" />
          <Skeleton className="h-7 w-24 bg-white/[0.06]" />
          <Skeleton className="h-3 w-12 bg-white/[0.06]" />
          <Skeleton className="h-8 w-full bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5",
        className
      )}
    >
      <Skeleton className="h-4 w-32 mb-4 bg-white/[0.06]" />
      <Skeleton className="h-72 w-full rounded-xl bg-white/[0.06]" />
    </div>
  );
}

function BottomSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <Skeleton className="h-4 w-40 mb-4 bg-white/[0.06]" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full bg-white/[0.06]" />
            <Skeleton className="h-4 flex-1 bg-white/[0.06]" />
            <Skeleton className="h-4 w-16 bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Glass card wrapper                                                 */
/* ------------------------------------------------------------------ */

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Period pills                                                       */
/* ------------------------------------------------------------------ */

const PERIODS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

function PeriodPills({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-white/[0.04] p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            value === p.value
              ? "bg-white/[0.1] text-white shadow-sm"
              : "text-[#6b7280] hover:text-[#9ca3af]"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(() =>
    loadMetricsConfig()
  );
  const { selectedAccountId } = useAccount();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedAccountId) params.set("accountId", selectedAccountId);
    params.set("period", period);
    fetch("/api/metrics/dashboard?" + params.toString())
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedAccountId, period]);

  const handleMetricsChange = useCallback((metrics: string[]) => {
    setVisibleMetrics(metrics);
  }, []);

  // Prepare campaign comparison bar data
  const campaignBarData =
    data?.topCampaigns
      .filter((c) => c.spend > 0)
      .slice(0, 8)
      .map((c) => ({
        name: c.name.length > 20 ? c.name.slice(0, 18) + "..." : c.name,
        spend: c.spend,
      })) || [];

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            Vista general del rendimiento de tus campanas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodPills value={period} onChange={setPeriod} />
          <MetricsConfigModal
            visibleMetrics={visibleMetrics}
            onChange={handleMetricsChange}
          />
        </div>
      </div>

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* KPI Cards */}
      {loading || !data ? (
        <KPISkeleton />
      ) : (
        <KPICards
          data={data.kpis}
          dailyData={data.daily}
          visibleMetrics={visibleMetrics}
        />
      )}

      {/* Charts row: 2/3 area chart + 1/3 donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading || !data ? (
          <>
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <GlassCard className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-white mb-3">
                Rendimiento a lo largo del tiempo
              </h2>
              <LineChartComponent
                data={data.daily}
                dataKeys={[
                  { key: "spend", color: "#f97316", label: "Spend" },
                  { key: "clicks", color: "#ec4899", label: "Clicks" },
                  { key: "impressions", color: "#3b82f6", label: "Impressions" },
                ]}
                xAxisKey="date"
                toggleable
              />
            </GlassCard>
            <GlassCard>
              <h2 className="text-sm font-semibold text-white mb-3">
                Gasto por plataforma
              </h2>
              <PieChartComponent data={data.byPlatform} />
            </GlassCard>
          </>
        )}
      </div>

      {/* Campaign comparison bar chart */}
      {!loading && data && campaignBarData.length > 0 && (
        <GlassCard>
          <h2 className="text-sm font-semibold text-white mb-3">
            Comparativa de campanas
          </h2>
          <BarChartComponent
            data={campaignBarData}
            dataKeys={[{ key: "spend", label: "Spend", color: "#f97316" }]}
            xAxisKey="name"
            height={260}
          />
        </GlassCard>
      )}

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Bottom: full-width campaigns + alerts sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <BottomSkeleton />
            <BottomSkeleton />
          </>
        ) : (
          <>
            <TopCampaigns
              campaigns={data?.topCampaigns}
              className="lg:col-span-2"
            />
            <AlertsWidget />
          </>
        )}
      </div>
    </div>
  );
}
