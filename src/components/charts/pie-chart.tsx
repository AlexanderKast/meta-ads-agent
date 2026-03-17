"use client";

import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  type PieLabelRenderProps,
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
  linkedin: "#0077b5",
};

export function PieChartComponent({ data, className, height = 300 }: PieChartProps) {
  return (
    <div className={cn("w-full rounded-xl bg-surface border border-border p-4", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="spend"
            nameKey="platform"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(props: PieLabelRenderProps) => {
              const name = props.name || "";
              const percent = typeof props.percent === "number" ? props.percent : 0;
              return `${name} ${(percent * 100).toFixed(0)}%`;
            }}
            labelLine={{ stroke: "#6b7280" }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.platform}
                fill={PLATFORM_COLORS[entry.platform.toLowerCase()] || "#6b7280"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#ffffff",
            }}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Spend"]}
          />
          <Legend
            wrapperStyle={{ color: "#9ca3af", fontSize: 12 }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
