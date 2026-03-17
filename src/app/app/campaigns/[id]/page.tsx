"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Metric {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
}

interface CampaignDetail {
  id: string;
  platform: string;
  campaign_name: string;
  status: string;
  objective: string;
  budget_amount: number;
  budget_currency: string;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, string> = { meta: "📘", google: "🔍", tiktok: "🎵", linkedin: "💼" };

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load campaign details from local mappings
    fetch("/api/platforms/campaigns")
      .then((r) => r.json())
      .then((data) => {
        const c = (Array.isArray(data) ? data : []).find((x: CampaignDetail) => x.id === id);
        if (c) setCampaign(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!campaign) return;
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

    fetch(`/api/platforms/${campaign.platform}/campaigns/${id}/metrics?startDate=${start}&endDate=${end}`)
      .then((r) => r.json())
      .then((data) => setMetrics(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [campaign, id]);

  if (loading) return <p className="text-text-dim text-sm">Cargando...</p>;
  if (!campaign) return <p className="text-error text-sm">Campana no encontrada</p>;

  const totals = metrics.reduce((acc, m) => ({
    impressions: acc.impressions + m.impressions,
    clicks: acc.clicks + m.clicks,
    spend: acc.spend + m.spend,
    conversions: acc.conversions + m.conversions,
    revenue: acc.revenue + m.revenue,
  }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0 });

  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : "0";
  const cpc = totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : "0";
  const roas = totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : "0";

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">{PLATFORM_ICONS[campaign.platform]}</span>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{campaign.campaign_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={campaign.status === "active" ? "success" : "info"}>{campaign.status}</Badge>
            <Badge>{campaign.objective}</Badge>
            <span className="text-xs text-text-dim">${campaign.budget_amount} {campaign.budget_currency}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Impressions</span>
          <p className="text-xl font-bold text-text-primary">{totals.impressions.toLocaleString()}</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Clicks</span>
          <p className="text-xl font-bold text-text-primary">{totals.clicks.toLocaleString()}</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Spend</span>
          <p className="text-xl font-bold text-text-primary">${totals.spend.toFixed(2)}</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">CTR</span>
          <p className="text-xl font-bold text-primary">{ctr}%</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">ROAS</span>
          <p className="text-xl font-bold text-success">{roas}x</p>
        </Card>
      </div>

      {/* Daily Metrics Table */}
      {metrics.length > 0 && (
        <Card variant="bordered" className="overflow-x-auto">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Metricas diarias</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-dim border-b border-border">
                <th className="text-left py-2">Fecha</th>
                <th className="text-right py-2">Impr.</th>
                <th className="text-right py-2">Clicks</th>
                <th className="text-right py-2">Spend</th>
                <th className="text-right py-2">Conv.</th>
                <th className="text-right py-2">CPC</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={i} className="border-b border-border/50 text-text-secondary">
                  <td className="py-2">{m.date}</td>
                  <td className="text-right">{m.impressions.toLocaleString()}</td>
                  <td className="text-right">{m.clicks.toLocaleString()}</td>
                  <td className="text-right">${m.spend.toFixed(2)}</td>
                  <td className="text-right">{m.conversions}</td>
                  <td className="text-right">${m.clicks > 0 ? (m.spend / m.clicks).toFixed(2) : "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
