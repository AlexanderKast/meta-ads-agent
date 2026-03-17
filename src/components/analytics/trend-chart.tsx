"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#3b82f6",
  google: "#22c55e",
  tiktok: "#ec4899",
  linkedin: "#0077b5",
};

const METRIC_OPTIONS = [
  { key: "spend", label: "Spend ($)" },
  { key: "ctr", label: "CTR (%)" },
  { key: "cpc", label: "CPC ($)" },
  { key: "roas", label: "ROAS (x)" },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]["key"];

export interface DailyPlatformData {
  date: string;
  [key: string]: string | number; // e.g. meta_spend, google_ctr
}

interface TrendChartProps {
  data: DailyPlatformData[];
  platforms: string[];
}

export function TrendChart({ data, platforms }: TrendChartProps) {
  const [metric, setMetric] = useState<MetricKey>("spend");

  return (
    <div className="space-y-4">
      {/* Metric toggle */}
      <div className="flex gap-2">
        {METRIC_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMetric(opt.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              metric === opt.key
                ? "bg-primary text-white font-medium"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#e5e7eb",
              }}
              labelStyle={{ color: "#9ca3af" }}
            />
            <Legend
              wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
            />
            {platforms.map((platform) => (
              <Line
                key={platform}
                type="monotone"
                dataKey={`${platform}_${metric}`}
                name={platform}
                stroke={PLATFORM_COLORS[platform] || "#8884d8"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
