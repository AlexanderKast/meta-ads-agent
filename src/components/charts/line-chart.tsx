"use client";

import { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Area,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface DataKeyConfig {
  key: string;
  color?: string;
  label?: string;
}

interface LineChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKeys: DataKeyConfig[];
  xAxisKey?: string;
  className?: string;
  height?: number;
  /** If true, show toggles above chart */
  toggleable?: boolean;
}

const DEFAULT_COLORS = ["#f97316", "#ec4899", "#3b82f6", "#22c55e", "#a855f7", "#14b8a6"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-medium text-[#9ca3af] mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-[#d1d5db]">{entry.name}</span>
            <span className="text-xs font-semibold text-white ml-auto">
              {typeof entry.value === "number"
                ? entry.value >= 1000
                  ? `${(entry.value / 1000).toFixed(1)}K`
                  : entry.value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function LineChartComponent({
  data,
  dataKeys,
  xAxisKey = "date",
  className,
  height = 320,
  toggleable = false,
}: LineChartProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
    () => new Set(dataKeys.map((dk) => dk.key))
  );

  const toggleKey = useCallback((key: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* Toggle checkboxes */}
      {toggleable && (
        <div className="flex flex-wrap gap-3 mb-4">
          {dataKeys.map((dk, i) => {
            const color = dk.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const active = visibleKeys.has(dk.key);
            return (
              <button
                key={dk.key}
                onClick={() => toggleKey(dk.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                  active
                    ? "border-white/10 bg-white/[0.06] text-white"
                    : "border-transparent bg-transparent text-[#6b7280] hover:text-[#9ca3af]"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full transition-opacity"
                  style={{
                    backgroundColor: color,
                    opacity: active ? 1 : 0.3,
                  }}
                />
                {dk.label || dk.key}
              </button>
            );
          })}
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
        >
          <defs>
            {dataKeys.map((dk, i) => {
              const color =
                dk.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              return (
                <linearGradient
                  key={dk.key}
                  id={`gradient-${dk.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey={xAxisKey}
            stroke="transparent"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`
            }
          />
          <RechartsTooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1 }}
          />
          {dataKeys.map((dk, i) => {
            const color =
              dk.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            if (!visibleKeys.has(dk.key)) return null;
            return (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.label || dk.key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${dk.key})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: "#111827",
                  strokeWidth: 2,
                }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
