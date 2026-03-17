"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AccountSummary {
  platform: string;
  account_name: string;
  campaigns: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
}

const PLATFORM_ICONS: Record<string, string> = { meta: "📘", google: "🔍", tiktok: "🎵", linkedin: "💼" };

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platforms/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by platform
  const byPlatform = campaigns.reduce<Record<string, { count: number; budget: number }>>((acc, c) => {
    const p = c.platform as string;
    if (!acc[p]) acc[p] = { count: 0, budget: 0 };
    acc[p].count++;
    acc[p].budget += (c.budget_amount as number) || 0;
    return acc;
  }, {});

  const totalCampaigns = campaigns.length;
  const totalBudget = Object.values(byPlatform).reduce((s, p) => s + p.budget, 0);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted">Vista general de todas tus campanas activas.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Campanas totales</span>
          <p className="text-2xl font-bold text-text-primary">{totalCampaigns}</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Plataformas activas</span>
          <p className="text-2xl font-bold text-primary">{Object.keys(byPlatform).length}</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Presupuesto total</span>
          <p className="text-2xl font-bold text-text-primary">${totalBudget.toFixed(0)}</p>
        </Card>
        <Card variant="bordered" className="space-y-1">
          <span className="text-xs text-text-dim">Estado</span>
          <Badge variant="success">Activo</Badge>
        </Card>
      </div>

      {/* Per Platform */}
      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : Object.keys(byPlatform).length === 0 ? (
        <Card variant="bordered" className="text-center py-12">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-text-dim">Conecta plataformas y crea campanas para ver analytics.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(byPlatform).map(([platform, data]) => (
            <Card key={platform} variant="bordered" className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PLATFORM_ICONS[platform] || "📢"}</span>
                <div>
                  <h3 className="text-sm font-bold text-text-primary capitalize">{platform}</h3>
                  <p className="text-xs text-text-dim">{data.count} campanas</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-dim">Presupuesto</span>
                  <p className="text-text-primary font-medium">${data.budget.toFixed(0)}</p>
                </div>
                <div>
                  <span className="text-text-dim">Campanas</span>
                  <p className="text-text-primary font-medium">{data.count}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
