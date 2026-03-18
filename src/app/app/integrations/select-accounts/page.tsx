"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast, ToastContainer } from "@/components/ui/toast";

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

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Activa", color: "success" },
  2: { label: "Deshabilitada", color: "default" },
  3: { label: "Sin liquidar", color: "warning" },
  7: { label: "Pendiente", color: "warning" },
  9: { label: "Periodo de gracia", color: "warning" },
  100: { label: "Pendiente cierre", color: "default" },
  101: { label: "Cerrada", color: "default" },
};

export default function SelectAccountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [businessManagers, setBusinessManagers] = useState<MetaBM[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load existing connected accounts to pre-select them
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch ad accounts discovery
        const res = await fetch("/api/platforms/meta/ad-accounts");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Error al cargar cuentas");
          return;
        }

        setAdAccounts(data.ad_accounts || []);
        setBusinessManagers(data.business_managers || []);

        // Fetch already-connected accounts to pre-select them
        const acctRes = await fetch("/api/platforms/accounts");
        const acctData = await acctRes.json();
        if (Array.isArray(acctData)) {
          const connectedMetaIds = new Set(
            acctData
              .filter((a: { platform: string; is_active: boolean; platform_account_id: string }) =>
                a.platform === "meta" && a.is_active && a.platform_account_id !== "default"
              )
              .map((a: { platform_account_id: string }) => a.platform_account_id)
          );
          if (connectedMetaIds.size > 0) {
            setSelectedIds(connectedMetaIds as Set<string>);
          }
        }
      } catch {
        setError("Error de conexion al cargar cuentas");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Group accounts by BM
  const grouped = useMemo(() => {
    const groups: { bm: MetaBM | null; accounts: MetaAdAccount[] }[] = [];

    for (const bm of businessManagers) {
      const bmAccounts = adAccounts.filter((a) => a.business_manager?.id === bm.id);
      if (bmAccounts.length > 0) {
        groups.push({ bm, accounts: bmAccounts });
      }
    }

    const personal = adAccounts.filter((a) => !a.business_manager);
    if (personal.length > 0) {
      groups.push({ bm: null, accounts: personal });
    }

    return groups;
  }, [adAccounts, businessManagers]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    return grouped
      .map((g) => ({
        ...g,
        accounts: g.accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.account_id.includes(q) ||
            a.id.includes(q) ||
            (g.bm?.name || "").toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.accounts.length > 0);
  }, [grouped, searchQuery]);

  function toggleAccount(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleBM(bmId: string | null) {
    const group = grouped.find((g) => (g.bm?.id || null) === bmId);
    if (!group) return;
    const allSelected = group.accounts.every((a) => selectedIds.has(a.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const a of group.accounts) {
        if (allSelected) next.delete(a.id);
        else next.add(a.id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(adAccounts.map((a) => a.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  const allSelected = adAccounts.length > 0 && selectedIds.size === adAccounts.length;

  async function handleSave() {
    if (selectedIds.size === 0) {
      toast("Selecciona al menos una cuenta", "error");
      return;
    }

    setSaving(true);
    try {
      const selected = adAccounts.filter((a) => selectedIds.has(a.id));
      const res = await fetch("/api/platforms/meta/save-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: selected }),
      });
      const data = await res.json();

      if (data.success) {
        toast(`${data.saved} cuentas guardadas correctamente`, "success");
        setTimeout(() => router.push("/app/integrations?success=meta"), 1000);
      } else {
        toast(data.error || "Error al guardar", "error");
      }
    } catch {
      toast("Error de conexion", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner size="lg" />
        <p className="text-text-muted text-sm">Descubriendo cuentas publicitarias de Meta...</p>
        <p className="text-text-dim text-xs">Esto puede tardar unos segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card variant="bordered" className="text-center space-y-4 py-8">
          <p className="text-red-400 text-sm">{error}</p>
          <Button variant="secondary" onClick={() => router.push("/app/integrations")}>
            Volver a Integraciones
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Seleccionar Cuentas de Meta</h1>
        <p className="text-sm text-text-muted mt-1">
          Se encontraron {adAccounts.length} cuentas publicitarias en {businessManagers.length} Business Manager{businessManagers.length !== 1 ? "s" : ""}.
          Selecciona las cuentas que deseas conectar.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar cuentas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg bg-bg-secondary border border-border-dim text-text-primary placeholder:text-text-dim focus:outline-none focus:border-primary"
        />
        <Button variant="ghost" size="sm" onClick={allSelected ? deselectAll : selectAll}>
          {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
        </Button>
        <Badge variant={selectedIds.size > 0 ? "info" : "default"}>
          {selectedIds.size} de {adAccounts.length} seleccionadas
        </Badge>
      </div>

      {/* Account groups */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const bmId = group.bm?.id || null;
          const groupSelected = group.accounts.filter((a) => selectedIds.has(a.id)).length;
          const allGroupSelected = groupSelected === group.accounts.length;
          const someGroupSelected = groupSelected > 0 && !allGroupSelected;

          return (
            <Card key={bmId || "personal"} variant="bordered" className="space-y-3">
              {/* BM Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleBM(bmId)}
                  className="flex items-center gap-3 text-left group"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded border border-border-dim bg-bg-secondary group-hover:border-primary transition-colors">
                    {allGroupSelected && (
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {someGroupSelected && (
                      <div className="w-2 h-2 rounded-sm bg-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {group.bm ? group.bm.name : "Cuentas personales"}
                    </h3>
                    <p className="text-xs text-text-dim">
                      {group.accounts.length} cuenta{group.accounts.length !== 1 ? "s" : ""}
                      {groupSelected > 0 && ` - ${groupSelected} seleccionada${groupSelected !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </button>
                <Button variant="ghost" size="sm" onClick={() => toggleBM(bmId)}>
                  {allGroupSelected ? "Deseleccionar" : "Seleccionar todo"}
                </Button>
              </div>

              {/* Account list */}
              <div className="space-y-1">
                {group.accounts.map((acct) => {
                  const isSelected = selectedIds.has(acct.id);
                  const status = STATUS_LABELS[acct.account_status] || { label: "Desconocido", color: "default" };

                  return (
                    <button
                      key={acct.id}
                      onClick={() => toggleAccount(acct.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-bg-secondary border border-transparent hover:border-border-dim"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`flex items-center justify-center w-5 h-5 rounded border flex-shrink-0 transition-colors ${
                        isSelected ? "bg-primary border-primary" : "border-border-dim bg-bg-tertiary"
                      }`}>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Account info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary truncate">{acct.name}</p>
                          <Badge variant={status.color as "success" | "warning" | "default"} className="text-[10px] flex-shrink-0">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-dim mt-0.5">
                          {acct.id} · {acct.currency} · {acct.timezone_name}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 bg-bg-primary/95 backdrop-blur-sm py-4 border-t border-border-dim -mx-4 px-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/app/integrations")}>
          Cancelar
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted">
            {selectedIds.size} cuenta{selectedIds.size !== 1 ? "s" : ""} seleccionada{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <Button onClick={handleSave} disabled={saving || selectedIds.size === 0}>
            {saving ? "Guardando..." : `Guardar ${selectedIds.size} cuenta${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
