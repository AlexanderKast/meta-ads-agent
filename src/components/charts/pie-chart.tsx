"use client";

import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface PlatformData {
  platform: string;
  spend: number;
  impressions?: number;
}

interface PieChartProps {
  data: PlatformData[];
  className?: string;
  height?: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#3b82f6",
  google: "#22c55e",
  tiktok: "#ec4899",
  linkedin: "#0ea5e9",
};

const FALLBACK_COLORS = ["#f97316", "#a855f7", "#14b8a6", "#eab308"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: d.payload.fill }}
        />
        <span className="text-xs font-medium text-white capitalize">
          {d.name}
        </span>
      </div>
      <p className="text-sm font-bold text-white">
        ${Number(d.value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function PieChartComponent({
  data,
  className,
  height = 300,
}: PieChartProps) {
  const totalSpend = data.reduce((sum, d) => sum + d.spend, 0);
  const formattedTotal =
    totalSpend >= 1_000_000
      ? `$${(totalSpend / 1_000_000).toFixed(1)}M`
      : totalSpend >= 1_000
      ? `$${(totalSpend / 1_000).toFixed(1)}K`
      : `$${totalSpend.toFixed(2)}`;

  return (
    <div className={cn("w-full relative", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="spend"
            nameKey="platform"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={3}
            cornerRadius={4}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.platform}
                fill={
                  PLATFORM_COLORS[entry.platform.toLowerCase()] ||
                  FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                }
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-medium">
          Total
        </span>
        <span className="text-lg font-bold text-white">{formattedTotal}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {data.map((entry, i) => (
          <div key={entry.platform} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  PLATFORM_COLORS[entry.platform.toLowerCase()] ||
                  FALLBACK_COLORS[i % FALLBACK_COLORS.length],
              }}
            />
            <span className="text-[11px] text-[#9ca3af] capitalize">
              {entry.platform}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
