"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConnectedAccount {
  id: string;
  platform: string;
  account_name: string;
}

const PLATFORM_ICONS: Record<string, string> = { meta: "📘", google: "🔍", tiktok: "🎵", linkedin: "💼" };

export default function NewCampaignPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<"awareness" | "consideration" | "conversion">("conversion");
  const [budgetAmount, setBudgetAmount] = useState(50);
  const [budgetType, setBudgetType] = useState<"daily" | "lifetime">("daily");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  // Ad content
  const [headline, setHeadline] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [cta, setCta] = useState("");
  const [landingUrl, setLandingUrl] = useState("");

  useEffect(() => {
    fetch("/api/platforms/accounts")
      .then((r) => r.json())
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!selectedAccount) return;
    setCreating(true);

    try {
      // Create campaign
      const campaignRes = await fetch(`/api/platforms/${selectedAccount.platform}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectedAccountId: selectedAccount.id,
          name,
          objective,
          budget: { amount: budgetAmount, currency: "USD", type: budgetType },
          startDate,
          endDate: endDate || undefined,
        }),
      });

      if (!campaignRes.ok) throw new Error("Error al crear campana");
      const campaign = await campaignRes.json();

      // Create ad if copy is provided
      if (headline && primaryText && landingUrl) {
        await fetch(`/api/platforms/${selectedAccount.platform}/ads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectedAccountId: selectedAccount.id,
            campaignMappingId: campaign.mapping?.id,
            headline,
            primaryText,
            cta: cta || "Learn More",
            landingUrl,
          }),
        });
      }

      router.push("/app/campaigns");
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <p className="text-text-dim text-sm">Cargando...</p>;

  if (accounts.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Nueva Campana</h1>
        <Card variant="bordered" className="text-center py-12 space-y-3">
          <p className="text-text-dim">Primero conecta al menos una plataforma de anuncios.</p>
          <Button size="sm" onClick={() => router.push("/app/integrations")}>Ir a Integraciones</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Nueva Campana</h1>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-primary" : "bg-surface")} />
        ))}
      </div>

      {/* Step 1: Select Account */}
      {step === 1 && (
        <Card variant="bordered" className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Selecciona la plataforma</h2>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => { setSelectedAccount(acc); setStep(2); }}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  selectedAccount?.id === acc.id
                    ? "border-primary bg-primary-light"
                    : "border-border bg-surface hover:border-border-hover"
                )}
              >
                <span className="text-2xl">{PLATFORM_ICONS[acc.platform]}</span>
                <p className="text-sm font-medium text-text-primary mt-1">{acc.account_name}</p>
                <Badge>{acc.platform}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Step 2: Campaign Settings */}
      {step === 2 && (
        <Card variant="bordered" className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Configuracion de campana</h2>

          <div>
            <label className="block text-xs text-text-dim mb-1">Nombre *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["awareness", "consideration", "conversion"] as const).map((obj) => (
              <button key={obj} onClick={() => setObjective(obj)}
                className={cn("p-2 rounded-lg border text-xs transition-all",
                  objective === obj ? "border-primary bg-primary-light text-text-primary" : "border-border bg-surface text-text-muted"
                )}>{obj}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-dim mb-1">Presupuesto (USD)</label>
              <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1">Tipo</label>
              <select value={budgetType} onChange={(e) => setBudgetType(e.target.value as "daily" | "lifetime")}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary">
                <option value="daily">Diario</option>
                <option value="lifetime">Total</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-dim mb-1">Fecha inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1">Fecha fin (opcional)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Atras</Button>
            <Button size="sm" onClick={() => setStep(3)} disabled={!name}>Siguiente</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Ad Copy + Publish */}
      {step === 3 && (
        <Card variant="bordered" className="space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Copy del anuncio</h2>
          <p className="text-xs text-text-dim">Pega el copy generado o escribe nuevo. Puedes publicar sin ads y agregarlos despues.</p>

          <Textarea label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} rows={1} />
          <Textarea label="Primary Text" value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} rows={3} />
          <Textarea label="CTA" value={cta} onChange={(e) => setCta(e.target.value)} rows={1} placeholder="Ej: Comprar ahora" />

          <div>
            <label className="block text-xs text-text-dim mb-1">Landing URL</label>
            <input value={landingUrl} onChange={(e) => setLandingUrl(e.target.value)} placeholder="https://..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setStep(2)}>Atras</Button>
            <Button size="sm" loading={creating} onClick={handleCreate}>
              {creating ? "Publicando..." : "Crear Campana"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
