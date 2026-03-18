"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast, ToastContainer } from "@/components/ui/toast";

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
}

interface MetaBM {
  id: string;
  name: string;
}

interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business_manager?: MetaBM;
}

interface MetaAccountsData {
  business_managers: MetaBM[];
  ad_accounts: MetaAdAccount[];
  total: number;
}

interface MetaAd {
  id: string;
  name: string;
  status: string;
  campaign_name: string;
  adset_name: string;
  created_time: string;
}

interface MetaAdsData {
  ads: MetaAd[];
  total: number;
}

const PLATFORMS = [
  { id: "meta", name: "Meta Ads", icon: "📘", description: "Facebook + Instagram", color: "from-blue-600 to-blue-400" },
  { id: "google", name: "Google Ads", icon: "🔍", description: "Search + Display + YouTube", color: "from-green-600 to-yellow-400" },
  { id: "tiktok", name: "TikTok Ads", icon: "🎵", description: "In-Feed + Spark + TopView", color: "from-pink-600 to-red-400" },
  { id: "linkedin", name: "LinkedIn Ads", icon: "💼", description: "Sponsored Content + InMail", color: "from-blue-700 to-blue-500" },
];

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="text-text-dim">Cargando...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}

const STATUS_LABELS: Record<number, string> = {
  1: "Activa",
  2: "Deshabilitada",
  3: "Sin liquidar",
  7: "Pendiente de revision",
  9: "En periodo de gracia",
  100: "Pendiente de cierre",
  101: "Cerrada",
  201: "Cualquier cuenta cerrada",
};

function AdAccountRow({ account, expanded, onToggle, ads, loadingAds }: {
  account: MetaAdAccount;
  expanded: boolean;
  onToggle: () => void;
  ads?: MetaAdsData;
  loadingAds: boolean;
}) {
  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left p-1.5 rounded hover:bg-bg-tertiary transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-secondary truncate">{account.name}</p>
          <p className="text-[10px] text-text-dim">{account.id} · {account.currency} · {STATUS_LABELS[account.account_status] || "Desconocido"}</p>
        </div>
        <span className="text-text-dim text-xs ml-2">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="pl-3 space-y-1">
          {loadingAds ? (
            <p className="text-[10px] text-text-dim">Cargando anuncios...</p>
          ) : ads ? (
            ads.total === 0 ? (
              <p className="text-[10px] text-text-dim">Sin anuncios en esta cuenta</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-[10px] text-text-muted font-semibold">{ads.total} anuncios</p>
                {ads.ads.slice(0, 20).map(ad => (
                  <div key={ad.id} className="flex items-center gap-2 p-1 rounded text-[10px]">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      ad.status === "active" ? "bg-green-500" :
                      ad.status === "paused" ? "bg-yellow-500" : "bg-red-500"
                    }`} />
                    <span className="text-text-secondary truncate flex-1">{ad.name}</span>
                    <span className="text-text-dim truncate">{ad.campaign_name}</span>
                  </div>
                ))}
                {ads.total > 20 && (
                  <p className="text-[10px] text-text-dim">...y {ads.total - 20} mas</p>
                )}
              </div>
            )
          ) : null}
        </div>
      )}
    </div>
  );
}

function IntegrationsContent() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaAccounts, setMetaAccounts] = useState<MetaAccountsData | null>(null);
  const [metaAds, setMetaAds] = useState<Record<string, MetaAdsData>>({});
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingAds, setLoadingAds] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const saveData = searchParams.get("save");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (saveData) {
      // Save the account from OAuth callback
      try {
        const data = JSON.parse(Buffer.from(saveData, "base64url").toString());
        fetch("/api/platforms/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then((r) => r.json())
          .then((result) => {
            if (result.success) {
              toast(`${data.platform} conectado exitosamente`, "success");
              // Reload accounts
              fetch("/api/platforms/accounts")
                .then((r) => r.json())
                .then((d) => setAccounts(Array.isArray(d) ? d : []));
            } else {
              toast(`Error al guardar: ${result.error}`, "error");
            }
          })
          .catch(() => toast("Error al guardar cuenta", "error"));
      } catch {
        toast("Error al procesar datos", "error");
      }
      // Clean URL
      window.history.replaceState({}, "", "/app/integrations");
    } else if (success) {
      toast(`${success} conectado exitosamente`, "success");
    } else if (error) {
      toast(`Error al conectar: ${error}`, "error");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/platforms/accounts")
      .then((r) => r.json())
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function isConnected(platformId: string) {
    return accounts.some((a) => a.platform === platformId && a.is_active);
  }

  function getAccount(platformId: string) {
    return accounts.find((a) => a.platform === platformId && a.is_active);
  }

  async function handleDisconnect(platformId: string) {
    await fetch("/api/platforms/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platformId }),
    });
    setAccounts((prev) => prev.filter((a) => a.platform !== platformId));
    toast("Plataforma desconectada", "info");
  }

  function handleConnect(platformId: string) {
    window.location.href = `/api/platforms/${platformId}/oauth`;
  }

  async function handleSync(platform?: string) {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/platforms/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, days: 30 }),
      });
      const data = await res.json();
      setSyncResult(data);
      if (res.ok) {
        toast(`Sincronizado: ${data.campaigns_discovered} campañas descubiertas, ${data.metrics_synced} métricas`, "success");
      } else {
        toast(data.error || "Error al sincronizar", "error");
      }
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setSyncing(false);
    }
  }

  async function loadMetaAccounts() {
    setLoadingMeta(true);
    try {
      const res = await fetch("/api/platforms/meta/ad-accounts");
      const data = await res.json();
      if (res.ok) setMetaAccounts(data);
      else toast(data.error || "Error", "error");
    } catch { toast("Error al cargar cuentas", "error"); }
    finally { setLoadingMeta(false); }
  }

  async function loadAds(accountId: string) {
    setLoadingAds(accountId);
    try {
      const res = await fetch(`/api/platforms/meta/ads?accountId=${accountId}`);
      const data = await res.json();
      if (res.ok) setMetaAds(prev => ({ ...prev, [accountId]: data }));
      else toast(data.error || "Error", "error");
    } catch { toast("Error al cargar anuncios", "error"); }
    finally { setLoadingAds(null); }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Integraciones</h1>
        <p className="text-sm text-text-muted">
          Conecta tus cuentas de anuncios para publicar campanas y leer metricas directamente.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleSync()}
          disabled={syncing || accounts.length === 0}
        >
          {syncing ? "Sincronizando..." : "🔄 Sincronizar Todas las Métricas"}
        </Button>
        {syncResult && (
          <span className="text-xs text-text-muted">
            {syncResult.campaigns_discovered} campañas · {syncResult.metrics_synced} métricas · {syncResult.errors?.length || 0} errores
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-text-dim text-sm">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((p) => {
            const connected = isConnected(p.id);
            const account = getAccount(p.id);

            return (
              <Card key={p.id} variant={connected ? "highlighted" : "bordered"} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl`}>
                      {p.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">{p.name}</h3>
                      <p className="text-xs text-text-dim">{p.description}</p>
                    </div>
                  </div>
                  {connected && <Badge variant="success">Conectado</Badge>}
                </div>

                {connected && account ? (
                  <div className="space-y-2">
                    <p className="text-xs text-text-muted">
                      Cuenta: <span className="text-text-secondary">{account.account_name}</span>
                    </p>
                    <p className="text-xs text-text-dim">
                      Conectado: {new Date(account.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDisconnect(p.id)}>
                        Desconectar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleSync(p.id)} disabled={syncing}>
                        {syncing ? "..." : "Sincronizar"}
                      </Button>
                    </div>

                    {p.id === "meta" && (
                      <div className="border-t border-border-dim pt-3 space-y-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={loadMetaAccounts}
                          disabled={loadingMeta}
                        >
                          {loadingMeta ? "Cargando..." : metaAccounts ? "Actualizar cuentas" : "Ver Business Managers y Cuentas"}
                        </Button>

                        {metaAccounts && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-text-secondary">
                              {metaAccounts.business_managers.length} BM · {metaAccounts.total} cuentas publicitarias
                            </p>

                            {metaAccounts.business_managers.map(bm => {
                              const bmAccounts = metaAccounts.ad_accounts.filter(a => a.business_manager?.id === bm.id);
                              if (bmAccounts.length === 0) return null;
                              return (
                                <div key={bm.id} className="bg-bg-secondary rounded-lg p-2 space-y-1">
                                  <p className="text-xs font-semibold text-text-primary">🏢 {bm.name}</p>
                                  {bmAccounts.map(acct => (
                                    <AdAccountRow
                                      key={acct.id}
                                      account={acct}
                                      expanded={expandedAccount === acct.id}
                                      onToggle={() => {
                                        if (expandedAccount === acct.id) {
                                          setExpandedAccount(null);
                                        } else {
                                          setExpandedAccount(acct.id);
                                          if (!metaAds[acct.id]) loadAds(acct.id);
                                        }
                                      }}
                                      ads={metaAds[acct.id]}
                                      loadingAds={loadingAds === acct.id}
                                    />
                                  ))}
                                </div>
                              );
                            })}

                            {(() => {
                              const personalAccounts = metaAccounts.ad_accounts.filter(a => !a.business_manager);
                              if (personalAccounts.length === 0) return null;
                              return (
                                <div className="bg-bg-secondary rounded-lg p-2 space-y-1">
                                  <p className="text-xs font-semibold text-text-primary">👤 Cuentas personales</p>
                                  {personalAccounts.map(acct => (
                                    <AdAccountRow
                                      key={acct.id}
                                      account={acct}
                                      expanded={expandedAccount === acct.id}
                                      onToggle={() => {
                                        if (expandedAccount === acct.id) {
                                          setExpandedAccount(null);
                                        } else {
                                          setExpandedAccount(acct.id);
                                          if (!metaAds[acct.id]) loadAds(acct.id);
                                        }
                                      }}
                                      ads={metaAds[acct.id]}
                                      loadingAds={loadingAds === acct.id}
                                    />
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Button size="sm" onClick={() => handleConnect(p.id)} className="w-full">
                    Conectar {p.name}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
