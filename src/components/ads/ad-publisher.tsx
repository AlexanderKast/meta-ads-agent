"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdVariation } from "@/lib/types";
import type { CampaignSummary } from "@/lib/platforms/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name: string;
  is_active: boolean;
}

interface AdPublisherProps {
  variation: AdVariation;
  platform: string;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "account" | "campaign" | "confirm" | "success" | "error";

export function AdPublisher({ variation, platform, isOpen, onClose }: AdPublisherProps) {
  const [step, setStep] = useState<Step>("account");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignSummary | null>(null);
  const [landingUrl, setLandingUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<{ adId: string } | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platforms/accounts");
      if (!res.ok) throw new Error("Error al cargar cuentas");
      const data: ConnectedAccount[] = await res.json();
      setAccounts(data.filter((a) => a.platform === platform));
    } catch {
      setErrorMsg("No se pudieron cargar las cuentas conectadas.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    if (isOpen) {
      setStep("account");
      setSelectedAccount(null);
      setSelectedCampaign(null);
      setLandingUrl("");
      setErrorMsg("");
      setSuccessData(null);
      fetchAccounts();
    }
  }, [isOpen, fetchAccounts]);

  async function fetchCampaigns(account: ConnectedAccount) {
    setLoading(true);
    try {
      const res = await fetch(`/api/platforms/${platform}/campaigns?accountId=${account.platform_account_id}`);
      if (!res.ok) throw new Error("Error al cargar campanas");
      const data: CampaignSummary[] = await res.json();
      setCampaigns(data);
      setStep("campaign");
    } catch {
      setErrorMsg("No se pudieron cargar las campanas.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAccount(account: ConnectedAccount) {
    setSelectedAccount(account);
    fetchCampaigns(account);
  }

  function handleSelectCampaign(campaign: CampaignSummary) {
    setSelectedCampaign(campaign);
    setStep("confirm");
  }

  async function handlePublish() {
    if (!selectedAccount || !selectedCampaign) return;
    setPublishing(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/platforms/${platform}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectedAccountId: selectedAccount.id,
          campaignMappingId: selectedCampaign.id,
          headline: variation.headline,
          primaryText: variation.primaryText,
          description: variation.description,
          cta: variation.cta,
          landingUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al publicar");
      }
      const data = await res.json();
      setSuccessData(data);
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error al publicar el anuncio");
      setStep("error");
    } finally {
      setPublishing(false);
    }
  }

  if (!isOpen) return null;

  const platformLabel: Record<string, string> = {
    meta: "Meta Ads",
    google: "Google Ads",
    tiktok: "TikTok Ads",
    linkedin: "LinkedIn Ads",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            Publicar en {platformLabel[platform] || platform}
          </h2>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-primary transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-text-dim">
          <span className={cn("px-2 py-0.5 rounded-full", step === "account" ? "bg-primary/20 text-primary" : "bg-surface")}>
            1. Cuenta
          </span>
          <span className="text-border">/</span>
          <span className={cn("px-2 py-0.5 rounded-full", step === "campaign" ? "bg-primary/20 text-primary" : "bg-surface")}>
            2. Campana
          </span>
          <span className="text-border">/</span>
          <span className={cn("px-2 py-0.5 rounded-full", step === "confirm" ? "bg-primary/20 text-primary" : "bg-surface")}>
            3. Confirmar
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {/* Step 1: Select Account */}
        {step === "account" && !loading && (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Selecciona la cuenta donde publicar:</p>
            {accounts.length === 0 ? (
              <div className="text-sm text-text-dim py-4 text-center">
                No hay cuentas de {platformLabel[platform] || platform} conectadas.
                <br />
                <a href="/app/integrations" className="text-primary hover:underline">Conectar cuenta</a>
              </div>
            ) : (
              accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary/50 hover:bg-surface-hover transition-all"
                >
                  <div className="font-medium text-sm text-text-primary">{acc.account_name}</div>
                  <div className="text-xs text-text-dim">{acc.platform_account_id}</div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Select Campaign */}
        {step === "campaign" && !loading && (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">Selecciona una campana existente:</p>
            {campaigns.length === 0 ? (
              <div className="text-sm text-text-dim py-4 text-center">
                No hay campanas en esta cuenta.
              </div>
            ) : (
              campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCampaign(c)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary/50 hover:bg-surface-hover transition-all"
                >
                  <div className="font-medium text-sm text-text-primary">{c.name}</div>
                  <div className="text-xs text-text-dim flex items-center gap-2">
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full",
                      c.status === "active" ? "bg-success" : "bg-text-dim"
                    )} />
                    {c.status}
                    {c.objective && <span>- {c.objective}</span>}
                  </div>
                </button>
              ))
            )}
            <button
              onClick={() => setStep("account")}
              className="text-xs text-text-dim hover:text-text-primary transition-colors"
            >
              &larr; Cambiar cuenta
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-dim">Cuenta</span>
                <span className="text-text-primary font-medium">{selectedAccount?.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Campana</span>
                <span className="text-text-primary font-medium">{selectedCampaign?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Headline</span>
                <span className="text-text-primary font-medium truncate max-w-[200px]">{variation.headline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">CTA</span>
                <span className="text-text-primary font-medium">{variation.cta}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Landing URL *</label>
              <input
                type="url"
                value={landingUrl}
                onChange={(e) => setLandingUrl(e.target.value)}
                placeholder="https://tu-sitio.com/landing"
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("campaign")}
                className="text-xs text-text-dim hover:text-text-primary transition-colors"
              >
                &larr; Volver
              </button>
              <div className="flex-1" />
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                size="sm"
                loading={publishing}
                disabled={!landingUrl}
                onClick={handlePublish}
              >
                Publicar
              </Button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && successData && (
          <div className="text-center py-4 space-y-3">
            <div className="text-4xl">🎉</div>
            <h3 className="text-lg font-semibold text-text-primary">Anuncio publicado</h3>
            <p className="text-sm text-text-secondary">
              ID del anuncio: <code className="bg-surface px-2 py-0.5 rounded text-xs">{successData.adId}</code>
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <Button size="sm" onClick={() => window.open(`/app/campaigns`, "_blank")}>
                Ver campanas
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="space-y-3">
            <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-error text-sm">
              {errorMsg}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setErrorMsg("");
                  setStep("account");
                  fetchAccounts();
                }}
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
