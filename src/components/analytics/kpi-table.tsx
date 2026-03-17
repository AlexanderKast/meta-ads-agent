"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface AnalyticsMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  roas: number;
}

interface KpiTableProps {
  metrics: AnalyticsMetrics;
}

interface KpiRow {
  name: string;
  value: string;
  status: "success" | "warning" | "default";
  threshold: string;
}

function getStatus(val: number, good: number, bad: number, higherIsBetter: boolean): "success" | "warning" | "default" {
  if (higherIsBetter) {
    if (val >= good) return "success";
    if (val <= bad) return "warning";
    return "default";
  }
  if (val <= good) return "success";
  if (val >= bad) return "warning";
  return "default";
}

function buildRows(m: AnalyticsMetrics): KpiRow[] {
  return [
    {
      name: "Total Spend",
      value: `$${m.spend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: "default",
      threshold: "N/A",
    },
    {
      name: "Impressions",
      value: m.impressions.toLocaleString("en-US"),
      status: "default",
      threshold: "N/A",
    },
    {
      name: "Clicks",
      value: m.clicks.toLocaleString("en-US"),
      status: "default",
      threshold: "N/A",
    },
    {
      name: "CTR",
      value: `${m.ctr.toFixed(2)}%`,
      status: getStatus(m.ctr, 2, 0.5, true),
      threshold: "Good > 2% | Bad < 0.5%",
    },
    {
      name: "CPC",
      value: `$${m.cpc.toFixed(2)}`,
      status: getStatus(m.cpc, 1.5, 5, false),
      threshold: "Good < $1.50 | Bad > $5.00",
    },
    {
      name: "CPM",
      value: `$${m.cpm.toFixed(2)}`,
      status: getStatus(m.cpm, 10, 30, false),
      threshold: "Good < $10 | Bad > $30",
    },
    {
      name: "Conversions",
      value: m.conversions.toLocaleString("en-US"),
      status: "default",
      threshold: "N/A",
    },
    {
      name: "ROAS",
      value: `${m.roas.toFixed(2)}x`,
      status: getStatus(m.roas, 3, 1, true),
      threshold: "Good > 3x | Bad < 1x",
    },
  ];
}

const statusLabel: Record<string, string> = {
  success: "Good",
  warning: "Bad",
  default: "OK",
};

export function KpiTable({ metrics }: KpiTableProps) {
  const rows = buildRows(metrics);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {["Metric", "Value", "Status", "Threshold"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-gray-400 pb-3 pr-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.name}
              className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 pr-4 font-medium text-gray-200">{row.name}</td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  row.status === "success" && "text-green-400",
                  row.status === "warning" && "text-red-400"
                )}
              >
                {row.value}
              </td>
              <td className="py-3 pr-4">
                <Badge
                  variant={row.status === "success" ? "success" : row.status === "warning" ? "warning" : "default"}
                >
                  {statusLabel[row.status]}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-gray-500 text-xs">{row.threshold}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
