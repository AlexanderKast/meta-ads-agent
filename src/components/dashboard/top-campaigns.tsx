"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-dim">
                <th className="text-left py-2 font-medium">Campaign</th>
                <th className="text-left py-2 font-medium">Platform</th>
                <th className="text-right py-2 font-medium">Spend</th>
                <th className="text-right py-2 font-medium">ROAS</th>
                <th className="text-right py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 5).map((campaign, i) => {
                const platformKey = campaign.platform.toLowerCase();
                return (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-text-secondary">{campaign.name}</td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold",
                          platformColors[platformKey] || "bg-surface text-text-dim"
                        )}
                      >
                        {platformIcons[platformKey] || "?"}
                      </span>
                    </td>
                    <td className="py-2 text-right text-text-secondary">
                      ${campaign.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 text-right font-medium text-primary">
                      {campaign.roas.toFixed(2)}x
                    </td>
                    <td className="py-2 text-right">
                      <Badge variant={campaign.status === "active" ? "success" : "default"}>
                        {campaign.status || "active"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
