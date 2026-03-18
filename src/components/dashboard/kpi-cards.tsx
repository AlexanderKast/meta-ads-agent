"use client";

import { Card } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

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
  { key: "spend", prevKey: "prevSpend", label: "Spend", type: "currency" as const, invertDelta: true, tooltip: "Total invertido en anuncios en el periodo seleccionado" },
  { key: "impressions", prevKey: "prevImpressions", label: "Impressions", type: "number" as const, tooltip: "Cantidad de veces que se mostraron tus anuncios" },
  { key: "clicks", prevKey: "prevClicks", label: "Clicks", type: "number" as const, tooltip: "Numero total de clics en tus anuncios" },
  { key: "ctr", prevKey: "prevCtr", label: "CTR", type: "percent" as const, tooltip: "Click-Through Rate: porcentaje de impresiones que generaron clic" },
  { key: "cpc", prevKey: "prevCpc", label: "CPC", type: "currency" as const, invertDelta: true, tooltip: "Cost Per Click: costo promedio por cada clic" },
  { key: "conversions", prevKey: "prevConversions", label: "Conversions", type: "number" as const, tooltip: "Acciones completadas (compras, registros, etc.)" },
  { key: "roas", prevKey: "prevRoas", label: "ROAS", type: "decimal" as const, tooltip: "Return On Ad Spend: ingresos generados por cada dolar invertido" },
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
          <Card key={kpi.key} variant="bordered" className="space-y-1 p-4 group">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-dim">{kpi.label}</span>
              <Tooltip>
                <TooltipTrigger className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity">
                  <InfoIcon className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{kpi.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-bold text-text-primary">{formatValue(value, kpi.type)}</p>
            {delta && (
              <span
                className={cn(
                  "text-xs font-medium inline-flex items-center gap-1",
                  isPositive ? "text-success" : "text-error"
                )}
              >
                <span>{isPositive ? "\u2191" : "\u2193"}</span>
                {delta.value}
              </span>
            )}
          </Card>
        );
      })}
    </div>
  );
}
