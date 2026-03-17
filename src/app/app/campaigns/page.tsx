"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CampaignMapping {
  id: string;
  platform: string;
  campaign_name: string;
  status: string;
  objective: string;
  budget_amount: number;
  budget_currency: string;
  created_at: string;
  last_synced_at: string | null;
}

const PLATFORM_ICONS: Record<string, string> = { meta: "📘", google: "🔍", tiktok: "🎵", linkedin: "💼" };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignMapping[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load campaigns from local mappings
    fetch("/api/platforms/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campanas</h1>
          <p className="text-sm text-text-muted">Gestiona tus campanas publicadas en todas las plataformas.</p>
        </div>
        <Link href="/app/campaigns/new">
          <Button size="sm">+ Nueva campana</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : campaigns.length === 0 ? (
        <Card variant="bordered" className="text-center py-12 space-y-3">
          <div className="text-4xl">📢</div>
          <p className="text-text-dim">No hay campanas aun</p>
          <p className="text-xs text-text-dim">Genera copy con IA y publicalos directamente a tus plataformas.</p>
          <Link href="/app/campaigns/new">
            <Button size="sm">Crear primera campana</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/app/campaigns/${c.id}`}>
              <Card variant="bordered" className="flex items-center justify-between hover:border-border-hover transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{PLATFORM_ICONS[c.platform] || "📢"}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.campaign_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={c.status === "active" ? "success" : "info"}>{c.status}</Badge>
                      <span className="text-xs text-text-dim">{c.objective}</span>
                      {c.budget_amount > 0 && (
                        <span className="text-xs text-text-dim">
                          ${c.budget_amount} {c.budget_currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-text-dim">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
