"use client";

import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface BarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKeys: { key: string; color?: string; label?: string }[];
  xAxisKey?: string;
  className?: string;
  height?: number;
}

const DEFAULT_COLORS = ["#f97316", "#ec4899", "#3b82f6", "#22c55e", "#a855f7", "#14b8a6"];

const BAR_COLORS = [
  "#f97316", "#ec4899", "#3b82f6", "#22c55e", "#a855f7",
  "#14b8a6", "#eab308", "#ef4444", "#0ea5e9", "#8b5cf6",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-medium text-[#9ca3af] mb-2 truncate max-w-[200px]">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-xs text-[#d1d5db]">{entry.name}</span>
            <span className="text-xs font-semibold text-white ml-auto">
              {typeof entry.value === "number"
                ? entry.value >= 1000
                  ? "$" + (entry.value / 1000).toFixed(1) + "K"
                  : "$" + entry.value.toFixed(2)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function BarChartComponent({
  data,
  dataKeys,
  xAxisKey = "name",
  className,
  height = 300,
}: BarChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
            stroke="transparent"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v) => (v >= 1000 ? "$" + (v / 1000).toFixed(0) + "K" : "$" + v)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          {dataKeys.map((dk, i) => {
            const color = dk.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.label || dk.key}
                fill={color}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={BAR_COLORS[idx % BAR_COLORS.length]}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            );
          })}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
