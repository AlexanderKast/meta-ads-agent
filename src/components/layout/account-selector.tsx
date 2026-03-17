"use client";

import { useAccount } from "@/contexts/account-context";

const PLATFORM_ICONS: Record<string, string> = {
  meta: "📘",
  google: "🔍",
  tiktok: "🎵",
  linkedin: "💼",
};

export function AccountSelector() {
  const { accounts, selectedAccountId, setSelectedAccountId, loading } = useAccount();

  if (loading) {
    return <span className="text-xs text-text-dim">Cargando cuentas...</span>;
  }

  if (accounts.length === 0) {
    return (
      <a href="/app/integrations" className="text-xs text-text-dim hover:text-text-muted transition-colors">
        Sin cuentas conectadas
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-text-dim">Cuenta:</label>
      <select
        value={selectedAccountId || ""}
        onChange={(e) => setSelectedAccountId(e.target.value || null)}
        className="text-xs bg-surface border border-border-dim rounded-lg px-3 py-1.5 text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary max-w-[250px] truncate"
      >
        <option value="">Todas las cuentas</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {PLATFORM_ICONS[account.platform] || "📡"} {account.account_name} ({account.platform_account_id})
          </option>
        ))}
      </select>
    </div>
  );
}
