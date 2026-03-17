"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAccount } from "@/contexts/account-context";

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
  connected_account_id?: string;
}

const PLATFORM_ICONS: Record<string, string> = { meta: "\u{1F4D8}", google: "\u{1F50D}", tiktok: "\u{1F3B5}", linkedin: "\u{1F4BC}" };
const STATUS_OPTIONS = ["all", "active", "paused", "draft"] as const;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { selectedAccountId } = useAccount();

  useEffect(() => {
    // Load campaigns from local mappings
    fetch("/api/platforms/campaigns")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = campaigns;

    // Filter by selected account
    if (selectedAccountId) {
      result = result.filter((c) => c.connected_account_id === selectedAccountId);
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Filter by search term
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.campaign_name.toLowerCase().includes(q));
    }

    return result;
  }, [campaigns, selectedAccountId, statusFilter, search]);

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar campana..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-brand w-64"
        />
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                statusFilter === s
                  ? "bg-brand text-white"
                  : "bg-surface-alt text-text-muted hover:text-text-primary"
              }`}
            >
              {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {campaigns.length > 0 && (
          <span className="text-xs text-text-dim ml-auto">
            {filtered.length} de {campaigns.length} campanas
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <Card variant="bordered" className="text-center py-12 space-y-3">
          <div className="text-4xl">{"\u{1F4E2}"}</div>
          {campaigns.length === 0 ? (
            <>
              <p className="text-text-dim">No hay campanas aun</p>
              <p className="text-xs text-text-dim">Genera copy con IA y publicalos directamente a tus plataformas.</p>
              <Link href="/app/campaigns/new">
                <Button size="sm">Crear primera campana</Button>
              </Link>
            </>
          ) : (
            <p className="text-text-dim">No se encontraron campanas con los filtros actuales</p>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/app/campaigns/${c.id}`}>
              <Card variant="bordered" className="flex items-center justify-between hover:border-border-hover transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{PLATFORM_ICONS[c.platform] || "\u{1F4E2}"}</span>
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
