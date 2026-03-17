"use client";

import { Card } from "@/components/ui/card";
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

interface KPICardsProps {
  data: KPIData;
  className?: string;
}

function formatValue(value: number, type: "currency" | "number" | "percent" | "decimal"): string {
  switch (type) {
    case "currency":
      return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "number":
      return value.toLocaleString();
    case "percent":
      return `${value.toFixed(2)}%`;
    case "decimal":
      return value.toFixed(2);
  }
}

function getDelta(current: number, previous: number | undefined): { value: string; positive: boolean } | null {
  if (previous === undefined || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    positive: change >= 0,
  };
}

const kpiConfig = [
  { key: "spend", prevKey: "prevSpend", label: "Spend", type: "currency" as const, invertDelta: true },
  { key: "impressions", prevKey: "prevImpressions", label: "Impressions", type: "number" as const },
  { key: "clicks", prevKey: "prevClicks", label: "Clicks", type: "number" as const },
  { key: "ctr", prevKey: "prevCtr", label: "CTR", type: "percent" as const },
  { key: "cpc", prevKey: "prevCpc", label: "CPC", type: "currency" as const, invertDelta: true },
  { key: "conversions", prevKey: "prevConversions", label: "Conversions", type: "number" as const },
  { key: "roas", prevKey: "prevRoas", label: "ROAS", type: "decimal" as const },
];

export function KPICards({ data, className }: KPICardsProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3", className)}>
      {kpiConfig.map((kpi) => {
        const value = data[kpi.key as keyof KPIData] as number;
        const prevValue = data[kpi.prevKey as keyof KPIData] as number | undefined;
        const delta = getDelta(value, prevValue);
        const isPositive = delta ? (kpi.invertDelta ? !delta.positive : delta.positive) : true;

        return (
          <Card key={kpi.key} variant="bordered" className="space-y-1 p-4">
            <span className="text-xs text-text-dim">{kpi.label}</span>
            <p className="text-xl font-bold text-text-primary">{formatValue(value, kpi.type)}</p>
            {delta && (
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositive ? "text-success" : "text-error"
                )}
              >
                {delta.value}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
