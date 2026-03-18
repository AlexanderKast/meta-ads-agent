"use client";

import { Card } from "@/components/ui/card";
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

interface Campaign {
  name: string;
  platform: string;
  spend: number;
  roas: number;
  status?: string;
}

const platformIcons: Record<string, string> = {
  meta: "M",
  google: "G",
  tiktok: "T",
  linkedin: "L",
};

const platformColors: Record<string, string> = {
  meta: "bg-blue-500/20 text-blue-400",
  google: "bg-green-500/20 text-green-400",
  tiktok: "bg-pink-500/20 text-pink-400",
  linkedin: "bg-sky-600/20 text-sky-400",
};

interface TopCampaignsProps {
  campaigns?: Campaign[];
  className?: string;
}

export function TopCampaigns({ campaigns = [], className }: TopCampaignsProps) {
  return (
    <Card variant="bordered" className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-text-primary">Top Campaigns by ROAS</h3>

      {campaigns.length === 0 ? (
        <p className="text-xs text-text-dim py-2">No campaign data</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-text-dim text-xs font-medium h-8">Campaign</TableHead>
              <TableHead className="text-text-dim text-xs font-medium h-8">Platform</TableHead>
              <TableHead className="text-text-dim text-xs font-medium h-8 text-right">Spend</TableHead>
              <TableHead className="text-text-dim text-xs font-medium h-8 text-right">ROAS</TableHead>
              <TableHead className="text-text-dim text-xs font-medium h-8 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.slice(0, 5).map((campaign, i) => {
              const platformKey = campaign.platform.toLowerCase();
              return (
                <TableRow key={i} className="border-border/50 hover:bg-surface-hover/50">
                  <TableCell className="text-text-secondary text-xs py-2.5">{campaign.name}</TableCell>
                  <TableCell className="py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold",
                        platformColors[platformKey] || "bg-surface text-text-dim"
                      )}
                    >
                      {platformIcons[platformKey] || "?"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-text-secondary text-xs py-2.5">
                    ${campaign.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary text-xs py-2.5">
                    {campaign.roas.toFixed(2)}x
                  </TableCell>
                  <TableCell className="text-right py-2.5">
                    <Badge variant={campaign.status === "active" ? "success" : "default"}>
                      {campaign.status || "active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
