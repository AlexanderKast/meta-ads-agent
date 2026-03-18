"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Campaign {
  name: string;
  platform: string;
  spend: number;
  roas: number;
  status?: string;
  revenue?: number;
  ctr?: number;
  cpc?: number;
  conversions?: number;
  impressions?: number;
  clicks?: number;
  dailySpend?: { date: string; spend: number }[];
}

const platformColors: Record<string, string> = {
  meta: "bg-blue-500/20 text-blue-400",
  google: "bg-green-500/20 text-green-400",
  tiktok: "bg-pink-500/20 text-pink-400",
  linkedin: "bg-sky-600/20 text-sky-400",
};

const platformIcons: Record<string, string> = {
  meta: "M",
  google: "G",
  tiktok: "T",
  linkedin: "L",
};

const statusConfig: Record<string, { dot: string; label: string }> = {
  active: { dot: "bg-green-400", label: "Active" },
  paused: { dot: "bg-yellow-400", label: "Paused" },
  archived: { dot: "bg-red-400", label: "Archived" },
};

/* ------------------------------------------------------------------ */
/*  Sparkline for spend trend                                          */
/* ------------------------------------------------------------------ */

function SpendSparkline({ data }: { data?: { date: string; spend: number }[] }) {
  if (!data || data.length < 2) return <span className="text-[#6b7280]">--</span>;
  return (
    <div className="w-16 h-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="spend"
            stroke="#f97316"
            strokeWidth={1.5}
            fill="url(#sparkGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expandable row details                                             */
/* ------------------------------------------------------------------ */

function ExpandedDetails({ campaign }: { campaign: Campaign }) {
  const details = [
    { label: "Impressions", value: campaign.impressions?.toLocaleString() ?? "--" },
    { label: "Clicks", value: campaign.clicks?.toLocaleString() ?? "--" },
    { label: "Revenue", value: campaign.revenue != null ? "$" + campaign.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "--" },
    { label: "Platform", value: campaign.platform },
  ];

  return (
    <TableRow className="border-border/30 bg-white/[0.02]">
      <TableCell colSpan={9} className="py-3 px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {details.map((d) => (
            <div key={d.label}>
              <span className="text-[10px] uppercase tracking-wider text-[#6b7280] block">{d.label}</span>
              <span className="text-sm font-medium text-white">{d.value}</span>
            </div>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

interface TopCampaignsProps {
  campaigns?: Campaign[];
  className?: string;
}

export function TopCampaigns({ campaigns = [], className }: TopCampaignsProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-white mb-4">Top Campaigns</h3>

      {campaigns.length === 0 ? (
        <p className="text-xs text-[#6b7280] py-4">No campaign data available</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 w-6" />
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8">Campaign</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8">Status</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 text-right">Spend</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 text-right">Revenue</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 text-right">ROAS</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 text-right">CTR</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 text-right">CPC</TableHead>
                <TableHead className="text-[#6b7280] text-[11px] font-medium h-8 text-right">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.slice(0, 10).map((campaign, i) => {
                const platformKey = campaign.platform.toLowerCase();
                const status = statusConfig[campaign.status ?? "active"] ?? statusConfig.active;
                const isExpanded = expandedRows.has(i);
                const revenue = campaign.revenue ?? campaign.roas * campaign.spend;

                return (
                  <>
                    <TableRow
                      key={i}
                      className={cn(
                        "border-white/[0.04] cursor-pointer transition-colors",
                        isExpanded ? "bg-white/[0.04]" : "hover:bg-white/[0.03]"
                      )}
                      onClick={() => toggleRow(i)}
                    >
                      <TableCell className="py-2.5 w-6">
                        {isExpanded ? (
                          <ChevronDownIcon className="w-3.5 h-3.5 text-[#6b7280]" />
                        ) : (
                          <ChevronRightIcon className="w-3.5 h-3.5 text-[#6b7280]" />
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0",
                              platformColors[platformKey] || "bg-gray-500/20 text-gray-400"
                            )}
                          >
                            {platformIcons[platformKey] || "?"}
                          </span>
                          <span className="text-xs text-[#d1d5db] truncate max-w-[200px]">{campaign.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                          <span className="text-[11px] text-[#9ca3af]">{status.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-[#d1d5db] py-2.5">
                        {"$" + campaign.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-xs text-[#d1d5db] py-2.5">
                        {"$" + revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <Badge variant={campaign.roas >= 1 ? "success" : "warning"}>
                          {campaign.roas.toFixed(2) + "x"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-[#d1d5db] py-2.5">
                        {campaign.ctr != null ? campaign.ctr.toFixed(2) + "%" : "--"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-[#d1d5db] py-2.5">
                        {campaign.cpc != null ? "$" + campaign.cpc.toFixed(2) : "--"}
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <SpendSparkline data={campaign.dailySpend} />
                      </TableCell>
                    </TableRow>
                    {isExpanded && <ExpandedDetails key={"detail-" + i} campaign={campaign} />}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
