"use client";

import { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { LineChartComponent } from "@/components/charts/line-chart";
import { PieChartComponent } from "@/components/charts/pie-chart";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { useAccount } from "@/contexts/account-context";
import { cn } from "@/lib/utils";

interface KPIData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
  prevSpend?: number;
  prevImpressions?: number;
  prevClicks?: number;
  prevCtr?: number;
  prevCpc?: number;
  prevConversions?: number;
  prevRoas?: number;
}

interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
}

interface PlatformData {
  platform: string;
  spend: number;
  impressions: number;
}

interface DashboardData {
  kpis: KPIData;
  daily: DailyData[];
  byPlatform: PlatformData[];
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-surface border border-border", className)} />
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedAccountId } = useAccount();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedAccountId) params.set("accountId", selectedAccountId);
    fetch(`/api/metrics/dashboard?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  return (
    <div className="max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {/* KPI Cards */}
      {loading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 p-4" />
          ))}
        </div>
      ) : (
        <KPICards data={data.kpis} />
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading || !data ? (
          <>
            <SkeletonBlock className="lg:col-span-2 h-80" />
            <SkeletonBlock className="h-80" />
          </>
        ) : (
          <>
            <div className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-text-primary mb-2">Spend Over Time</h2>
              <LineChartComponent
                data={data.daily}
                dataKeys={[
                  { key: "spend", color: "#f97316", label: "Spend" },
                  { key: "clicks", color: "#ec4899", label: "Clicks" },
                ]}
                xAxisKey="date"
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary mb-2">Spend by Platform</h2>
              <PieChartComponent data={data.byPlatform} />
            </div>
          </>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <SkeletonBlock className="h-72" />
            <SkeletonBlock className="h-72" />
          </>
        ) : (
          <>
            <TopCampaigns />
            <AlertsWidget />
          </>
        )}
      </div>
    </div>
  );
}
