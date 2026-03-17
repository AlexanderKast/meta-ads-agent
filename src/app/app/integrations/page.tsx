"use client";

import { useEffect, useState } from "react";
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

const PLATFORMS = [
  { id: "meta", name: "Meta Ads", icon: "📘", description: "Facebook + Instagram", color: "from-blue-600 to-blue-400" },
  { id: "google", name: "Google Ads", icon: "🔍", description: "Search + Display + YouTube", color: "from-green-600 to-yellow-400" },
  { id: "tiktok", name: "TikTok Ads", icon: "🎵", description: "In-Feed + Spark + TopView", color: "from-pink-600 to-red-400" },
  { id: "linkedin", name: "LinkedIn Ads", icon: "💼", description: "Sponsored Content + InMail", color: "from-blue-700 to-blue-500" },
];

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) toast(`${success} conectado exitosamente`, "success");
    if (error) toast(`Error al conectar: ${error}`, "error");
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

  async function handleDisconnect(accountId: string) {
    await fetch("/api/platforms/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    toast("Cuenta desconectada", "info");
  }

  function handleConnect(platformId: string) {
    window.location.href = `/api/platforms/${platformId}/oauth`;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Integraciones</h1>
        <p className="text-sm text-text-muted">
          Conecta tus cuentas de anuncios para publicar campanas y leer metricas directamente.
        </p>
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
                    <Button variant="ghost" size="sm" onClick={() => handleDisconnect(account.id)}>
                      Desconectar
                    </Button>
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
