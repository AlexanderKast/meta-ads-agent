"use client";

import { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { LineChartComponent } from "@/components/charts/line-chart";
import { PieChartComponent } from "@/components/charts/pie-chart";
import { TopCampaigns } from "@/components/dashboard/top-campaigns";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { useAccount } from "@/contexts/account-context";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

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

interface CampaignData {
  name: string;
  platform: string;
  spend: number;
  roas: number;
  status?: string;
}

interface DashboardData {
  kpis: KPIData;
  daily: DailyData[];
  byPlatform: PlatformData[];
  topCampaigns: CampaignData[];
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <Card key={i} variant="bordered" className="space-y-2 p-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-12" />
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Card variant="bordered" className={className}>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </Card>
  );
}

function BottomSkeleton() {
  return (
    <Card variant="bordered">
      <Skeleton className="h-4 w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const { selectedAccountId } = useAccount();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedAccountId) params.set("accountId", selectedAccountId);
    params.set("period", period);
    fetch(`/api/metrics/dashboard?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setData(d))
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedAccountId, period]);

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header with period tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5">Vista general del rendimiento de tus campanas</p>
        </div>
        <Tabs defaultValue="7d" onValueChange={(v) => setPeriod(v as string)}>
          <TabsList>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="90d">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* KPI Cards */}
      {loading || !data ? (
        <KPISkeleton />
      ) : (
        <KPICards data={data.kpis} />
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading || !data ? (
          <>
            <ChartSkeleton className="lg:col-span-2" />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card variant="bordered" className="lg:col-span-2">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Gasto a lo largo del tiempo</h2>
              <LineChartComponent
                data={data.daily}
                dataKeys={[
                  { key: "spend", color: "#f97316", label: "Spend" },
                  { key: "clicks", color: "#ec4899", label: "Clicks" },
                ]}
                xAxisKey="date"
              />
            </Card>
            <Card variant="bordered">
              <h2 className="text-sm font-semibold text-text-primary mb-3">Gasto por plataforma</h2>
              <PieChartComponent data={data.byPlatform} />
            </Card>
          </>
        )}
      </div>

      <Separator />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <>
            <BottomSkeleton />
            <BottomSkeleton />
          </>
        ) : (
          <>
            <TopCampaigns campaigns={data?.topCampaigns} />
            <AlertsWidget />
          </>
        )}
      </div>
    </div>
  );
}
