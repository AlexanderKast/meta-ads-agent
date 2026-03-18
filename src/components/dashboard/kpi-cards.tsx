"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KPIData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
  revenue?: number;
  reach?: number;
  frequency?: number;
  uniqueClicks?: number;
  linkClicks?: number;
  uniqueCtr?: number;
  cpm?: number;
  costPerResult?: number;
  conversionRate?: number;
  costPerConversion?: number;
  roi?: number;
  engagementRate?: number;
  videoViews?: number;
  prevSpend?: number;
  prevImpressions?: number;
  prevClicks?: number;
  prevCtr?: number;
  prevCpc?: number;
  prevConversions?: number;
  prevRoas?: number;
  prevRevenue?: number;
  prevReach?: number;
  prevFrequency?: number;
  prevUniqueClicks?: number;
  prevLinkClicks?: number;
  prevUniqueCtr?: number;
  prevCpm?: number;
  prevCostPerResult?: number;
  prevConversionRate?: number;
  prevCostPerConversion?: number;
  prevRoi?: number;
  prevEngagementRate?: number;
  prevVideoViews?: number;
}

export interface DailyData {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  [key: string]: string | number;
}

/* ------------------------------------------------------------------ */
/*  Metric definitions                                                 */
/* ------------------------------------------------------------------ */

export type MetricCategory =
  | "Gasto"
  | "Alcance"
  | "Clicks"
  | "Conversiones"
  | "Eficiencia";

export interface MetricDef {
  key: string;
  prevKey: string;
  label: string;
  type: "currency" | "number" | "percent" | "decimal" | "multiplier";
  category: MetricCategory;
  invertDelta?: boolean;
  tooltip: string;
  icon: string;
  /** Compute value from raw KPI data (for derived metrics) */
  compute?: (d: KPIData) => number;
  computePrev?: (d: KPIData) => number;
}

export const ALL_METRICS: MetricDef[] = [
  // Gasto
  { key: "spend", prevKey: "prevSpend", label: "Spend", type: "currency", category: "Gasto", invertDelta: true, tooltip: "Total invertido en anuncios", icon: "DollarSign" },
  { key: "revenue", prevKey: "prevRevenue", label: "Revenue", type: "currency", category: "Gasto", tooltip: "Ingresos totales generados", icon: "TrendingUp", compute: (d) => d.revenue ?? (d.roas * d.spend), computePrev: (d) => d.prevRevenue ?? ((d.prevRoas ?? 0) * (d.prevSpend ?? 0)) },
  { key: "profit", prevKey: "prevProfit", label: "Profit", type: "currency", category: "Gasto", tooltip: "Beneficio neto (revenue - spend)", icon: "Wallet", compute: (d) => (d.revenue ?? d.roas * d.spend) - d.spend, computePrev: (d) => ((d.prevRevenue ?? (d.prevRoas ?? 0) * (d.prevSpend ?? 0))) - (d.prevSpend ?? 0) },

  // Alcance
  { key: "impressions", prevKey: "prevImpressions", label: "Impressions", type: "number", category: "Alcance", tooltip: "Veces que se mostraron tus anuncios", icon: "Eye" },
  { key: "reach", prevKey: "prevReach", label: "Reach", type: "number", category: "Alcance", tooltip: "Personas unicas alcanzadas", icon: "Users" },
  { key: "frequency", prevKey: "prevFrequency", label: "Frequency", type: "decimal", category: "Alcance", tooltip: "Impresiones promedio por persona (impressions/reach)", icon: "Repeat", compute: (d) => (d.reach && d.reach > 0 ? d.impressions / d.reach : d.frequency ?? 0), computePrev: (d) => (d.prevReach && d.prevReach > 0 ? (d.prevImpressions ?? 0) / d.prevReach : d.prevFrequency ?? 0) },

  // Clicks
  { key: "clicks", prevKey: "prevClicks", label: "Clicks", type: "number", category: "Clicks", tooltip: "Clics totales en tus anuncios", icon: "MousePointerClick" },
  { key: "uniqueClicks", prevKey: "prevUniqueClicks", label: "Unique Clicks", type: "number", category: "Clicks", tooltip: "Clics de usuarios unicos", icon: "MousePointer" },
  { key: "linkClicks", prevKey: "prevLinkClicks", label: "Link Clicks", type: "number", category: "Clicks", tooltip: "Clics en enlaces de destino", icon: "ExternalLink" },
  { key: "ctr", prevKey: "prevCtr", label: "CTR", type: "percent", category: "Clicks", tooltip: "Click-Through Rate: clics / impresiones", icon: "Percent" },
  { key: "uniqueCtr", prevKey: "prevUniqueCtr", label: "Unique CTR", type: "percent", category: "Clicks", tooltip: "CTR de usuarios unicos", icon: "UserCheck" },

  // Conversiones
  { key: "conversions", prevKey: "prevConversions", label: "Conversions", type: "number", category: "Conversiones", tooltip: "Acciones completadas", icon: "Target" },
  { key: "conversionRate", prevKey: "prevConversionRate", label: "Conv. Rate", type: "percent", category: "Conversiones", tooltip: "Porcentaje de clics que convierten", icon: "TrendingUp", compute: (d) => d.conversionRate ?? (d.clicks > 0 ? (d.conversions / d.clicks) * 100 : 0), computePrev: (d) => d.prevConversionRate ?? ((d.prevClicks ?? 0) > 0 ? ((d.prevConversions ?? 0) / (d.prevClicks ?? 1)) * 100 : 0) },
  { key: "costPerConversion", prevKey: "prevCostPerConversion", label: "Cost/Conv.", type: "currency", category: "Conversiones", invertDelta: true, tooltip: "Costo por cada conversion", icon: "Receipt", compute: (d) => d.costPerConversion ?? (d.conversions > 0 ? d.spend / d.conversions : 0), computePrev: (d) => d.prevCostPerConversion ?? ((d.prevConversions ?? 0) > 0 ? (d.prevSpend ?? 0) / (d.prevConversions ?? 1) : 0) },

  // Eficiencia
  { key: "cpc", prevKey: "prevCpc", label: "CPC", type: "currency", category: "Eficiencia", invertDelta: true, tooltip: "Costo por clic", icon: "DollarSign" },
  { key: "cpm", prevKey: "prevCpm", label: "CPM", type: "currency", category: "Eficiencia", invertDelta: true, tooltip: "Costo por mil impresiones", icon: "BarChart3", compute: (d) => d.cpm ?? (d.impressions > 0 ? (d.spend / d.impressions) * 1000 : 0), computePrev: (d) => d.prevCpm ?? ((d.prevImpressions ?? 0) > 0 ? ((d.prevSpend ?? 0) / (d.prevImpressions ?? 1)) * 1000 : 0) },
  { key: "costPerResult", prevKey: "prevCostPerResult", label: "Cost/Result", type: "currency", category: "Eficiencia", invertDelta: true, tooltip: "Costo por resultado", icon: "Calculator" },
  { key: "roas", prevKey: "prevRoas", label: "ROAS", type: "multiplier", category: "Eficiencia", tooltip: "Return on Ad Spend", icon: "Zap" },
  { key: "roi", prevKey: "prevRoi", label: "ROI", type: "percent", category: "Eficiencia", tooltip: "Return on Investment ((revenue-spend)/spend * 100)", icon: "PieChart", compute: (d) => d.roi ?? (d.spend > 0 ? (((d.revenue ?? d.roas * d.spend) - d.spend) / d.spend) * 100 : 0), computePrev: (d) => d.prevRoi ?? ((d.prevSpend ?? 0) > 0 ? ((((d.prevRevenue ?? (d.prevRoas ?? 0) * (d.prevSpend ?? 0))) - (d.prevSpend ?? 0)) / (d.prevSpend ?? 1)) * 100 : 0) },
  { key: "engagementRate", prevKey: "prevEngagementRate", label: "Engagement", type: "percent", category: "Eficiencia", tooltip: "Tasa de engagement", icon: "Heart" },
  { key: "videoViews", prevKey: "prevVideoViews", label: "Video Views", type: "number", category: "Eficiencia", tooltip: "Visualizaciones de video", icon: "Play" },
];

export const DEFAULT_VISIBLE_METRICS = [
  "spend",
  "impressions",
  "clicks",
  "ctr",
  "cpc",
  "conversions",
  "roas",
  "revenue",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatValue(
  value: number,
  type: "currency" | "number" | "percent" | "decimal" | "multiplier"
): string {
  if (isNaN(value) || !isFinite(value)) return "--";
  switch (type) {
    case "currency":
      if (value >= 1_000_000)
        return `$${(value / 1_000_000).toFixed(2)}M`;
      if (value >= 1_000)
        return `$${(value / 1_000).toFixed(1)}K`;
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "number":
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString();
    case "percent":
      return `${value.toFixed(2)}%`;
    case "decimal":
      return value.toFixed(2);
    case "multiplier":
      return `${value.toFixed(2)}x`;
  }
}

function getDelta(
  current: number,
  previous: number | undefined
): { value: string; pct: number } | null {
  if (previous === undefined || previous === 0) return null;
  const change = ((current - previous) / Math.abs(previous)) * 100;
  if (isNaN(change) || !isFinite(change)) return null;
  return {
    value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    pct: change,
  };
}

function getMetricValue(metric: MetricDef, data: KPIData): number {
  if (metric.compute) return metric.compute(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any)[metric.key] as number) ?? 0;
}

function getPrevMetricValue(metric: MetricDef, data: KPIData): number | undefined {
  if (metric.computePrev) return metric.computePrev(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any)[metric.prevKey] as number | undefined;
}

/* ------------------------------------------------------------------ */
/*  Mini sparkline                                                     */
/* ------------------------------------------------------------------ */

function MiniSparkline({
  data,
  dataKey,
  color,
  positive,
}: {
  data: DailyData[];
  dataKey: string;
  color: string;
  positive: boolean;
}) {
  const gradientId = `spark-${dataKey}-${positive ? "p" : "n"}`;
  return (
    <div className="w-full h-8 mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KPICard({
  metric,
  data,
  dailyData,
}: {
  metric: MetricDef;
  data: KPIData;
  dailyData: DailyData[];
}) {
  const value = getMetricValue(metric, data);
  const prevValue = getPrevMetricValue(metric, data);
  const delta = getDelta(value, prevValue);
  const isPositive = delta
    ? metric.invertDelta
      ? delta.pct < 0
      : delta.pct >= 0
    : true;

  const glowColor = delta
    ? isPositive
      ? "shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)]"
      : "shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)]"
    : "";

  const borderColor = delta
    ? isPositive
      ? "border-green-500/20"
      : "border-red-500/20"
    : "border-white/[0.06]";

  const sparkColor = isPositive ? "#22c55e" : "#ef4444";

  // For sparkline, use "spend" as fallback key for sparkline data
  const sparkKey = ["spend", "impressions", "clicks"].includes(metric.key)
    ? metric.key
    : "spend";

  return (
    <div
      className={cn(
        "relative group rounded-2xl p-4 transition-all duration-300",
        "bg-white/[0.03] backdrop-blur-xl border",
        borderColor,
        glowColor,
        "hover:bg-white/[0.06] hover:scale-[1.02]"
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">
          {metric.label}
        </span>
        <Tooltip>
          <TooltipTrigger className="text-[#9ca3af] opacity-0 group-hover:opacity-100 transition-opacity">
            <InfoIcon className="w-3 h-3" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{metric.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-white tracking-tight">
        {formatValue(value, metric.type)}
      </p>

      {/* Delta */}
      <div className="flex items-center gap-1.5 mt-0.5">
        {delta ? (
          <span
            className={cn(
              "text-xs font-semibold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md",
              isPositive
                ? "text-green-400 bg-green-500/10"
                : "text-red-400 bg-red-500/10"
            )}
          >
            <span className="text-[10px]">{isPositive ? "\u2191" : "\u2193"}</span>
            {delta.value}
          </span>
        ) : (
          <span className="text-xs text-[#6b7280]">--</span>
        )}
        <span className="text-[10px] text-[#6b7280]">vs periodo anterior</span>
      </div>

      {/* Sparkline */}
      {dailyData.length > 1 && (
        <MiniSparkline
          data={dailyData}
          dataKey={sparkKey}
          color={sparkColor}
          positive={isPositive}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported Component                                                 */
/* ------------------------------------------------------------------ */

interface KPICardsProps {
  data: KPIData;
  dailyData?: DailyData[];
  visibleMetrics?: string[];
  className?: string;
}

export function KPICards({
  data,
  dailyData = [],
  visibleMetrics = DEFAULT_VISIBLE_METRICS,
  className,
}: KPICardsProps) {
  const metrics = useMemo(
    () => ALL_METRICS.filter((m) => visibleMetrics.includes(m.key)),
    [visibleMetrics]
  );

  return (
    <div
      className={cn(
        "grid gap-3",
        "grid-cols-[repeat(auto-fill,minmax(200px,1fr))]",
        className
      )}
    >
      {metrics.map((metric) => (
        <KPICard
          key={metric.key}
          metric={metric}
          data={data}
          dailyData={dailyData}
        />
      ))}
    </div>
  );
}
