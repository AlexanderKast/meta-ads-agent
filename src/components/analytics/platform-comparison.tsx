"use client";

import { cn } from "@/lib/utils";

const PLATFORM_ICONS: Record<string, string> = {
  meta: "\uD83D\uDCD8",
  google: "\uD83D\uDD0D",
  tiktok: "\uD83C\uDFB5",
  linkedin: "\uD83D\uDCBC",
};

export interface PlatformMetric {
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
}

interface PlatformComparisonProps {
  data: PlatformMetric[];
}

function ctrColor(val: number): string {
  if (val > 2) return "text-green-400";
  if (val < 0.5) return "text-red-400";
  return "text-yellow-400";
}

function cpcColor(val: number): string {
  if (val < 1.5) return "text-green-400";
  if (val > 5) return "text-red-400";
  return "text-yellow-400";
}

function roasColor(val: number): string {
  if (val > 3) return "text-green-400";
  if (val < 1) return "text-red-400";
  return "text-yellow-400";
}

type NumericKey = "spend" | "impressions" | "clicks" | "ctr" | "cpc" | "conversions" | "roas";

function findBest(data: PlatformMetric[], key: NumericKey, mode: "max" | "min" = "max"): string {
  if (data.length === 0) return "";
  const best = data.reduce((a, b) =>
    mode === "max" ? (b[key] > a[key] ? b : a) : b[key] < a[key] ? b : a
  );
  return best.platform;
}

function fmt(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
  return val.toFixed(0);
}

export function PlatformComparison({ data }: PlatformComparisonProps) {
  const bestSpend = findBest(data, "spend", "max");
  const bestImpressions = findBest(data, "impressions", "max");
  const bestClicks = findBest(data, "clicks", "max");
  const bestCtr = findBest(data, "ctr", "max");
  const bestCpc = findBest(data, "cpc", "min");
  const bestConversions = findBest(data, "conversions", "max");
  const bestRoas = findBest(data, "roas", "max");

  const columns = [
    "Platform",
    "Spend",
    "Impressions",
    "Clicks",
    "CTR",
    "CPC",
    "Conversions",
    "ROAS",
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            {columns.map((col) => (
              <th
                key={col}
                className="text-left text-xs font-medium text-gray-400 pb-3 pr-4"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.platform}
              className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
            >
              <td className="py-3 pr-4">
                <span className="inline-flex items-center gap-2">
                  <span>{PLATFORM_ICONS[row.platform] || "\uD83D\uDCE2"}</span>
                  <span
                    className={cn(
                      "font-medium capitalize text-gray-200"
                    )}
                  >
                    {row.platform}
                  </span>
                </span>
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  row.platform === bestSpend && "font-bold text-blue-400"
                )}
              >
                ${fmt(row.spend)}
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  row.platform === bestImpressions && "font-bold text-blue-400"
                )}
              >
                {fmt(row.impressions)}
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  row.platform === bestClicks && "font-bold text-blue-400"
                )}
              >
                {fmt(row.clicks)}
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  ctrColor(row.ctr),
                  row.platform === bestCtr && "font-bold"
                )}
              >
                {row.ctr.toFixed(2)}%
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  cpcColor(row.cpc),
                  row.platform === bestCpc && "font-bold"
                )}
              >
                ${row.cpc.toFixed(2)}
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  row.platform === bestConversions && "font-bold text-blue-400"
                )}
              >
                {fmt(row.conversions)}
              </td>
              <td
                className={cn(
                  "py-3 pr-4 tabular-nums",
                  roasColor(row.roas),
                  row.platform === bestRoas && "font-bold"
                )}
              >
                {row.roas.toFixed(2)}x
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
