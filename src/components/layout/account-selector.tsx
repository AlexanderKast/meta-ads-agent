"use client";

import { useState } from "react";
import { useAccount } from "@/contexts/account-context";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search, Link as LinkIcon } from "lucide-react";

const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-500",
  google: "bg-red-500",
  tiktok: "bg-pink-500",
  linkedin: "bg-sky-600",
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta",
  google: "Google",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

export function AccountSelector() {
  const { accounts, selectedAccountId, selectedAccount, setSelectedAccountId, loading } = useAccount();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.03] animate-pulse">
        <div className="w-2 h-2 rounded-full bg-white/10" />
        <div className="w-24 h-3 rounded bg-white/10" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <a
        href="/app/integrations"
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
      >
        <LinkIcon className="w-3.5 h-3.5" />
        Conectar cuenta
      </a>
    );
  }

  // Detect duplicate names to show account ID suffix
  const nameCounts = new Map<string, number>();
  accounts.forEach((a) => nameCounts.set(a.account_name, (nameCounts.get(a.account_name) || 0) + 1));

  const filteredAccounts = accounts.filter((account) =>
    account.account_name.toLowerCase().includes(search.toLowerCase()) ||
    account.platform.toLowerCase().includes(search.toLowerCase()) ||
    account.platform_account_id.includes(search)
  );

  const getDisplayName = (account: typeof accounts[0]) => {
    if ((nameCounts.get(account.account_name) || 0) > 1) {
      const suffix = account.platform_account_id.replace("act_", "").slice(-6);
      return `${account.account_name} (…${suffix})`;
    }
    return account.account_name;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex items-center gap-2 h-8 px-3 rounded-lg text-xs bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-150 cursor-pointer outline-none max-w-[240px]"
      >
        {selectedAccount ? (
          <>
            <div className={cn("w-2 h-2 rounded-full shrink-0", PLATFORM_COLORS[selectedAccount.platform] || "bg-gray-500")} />
            <span className="text-white/80 truncate">{getDisplayName(selectedAccount)}</span>
            <span className="text-white/30 shrink-0">{PLATFORM_LABELS[selectedAccount.platform] || selectedAccount.platform}</span>
          </>
        ) : (
          <span className="text-white/50">Todas las cuentas</span>
        )}
        <ChevronsUpDown className="w-3 h-3 text-white/30 shrink-0 ml-1" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[280px] p-0 bg-[#141418] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Buscar cuenta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/25 outline-none"
            autoFocus
          />
        </div>

        {/* Options */}
        <div className="max-h-[240px] overflow-y-auto py-1">
          {/* All accounts option */}
          <button
            onClick={() => {
              setSelectedAccountId(null);
              setOpen(false);
              setSearch("");
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-white/[0.04] transition-colors duration-100",
              !selectedAccountId ? "text-orange-400" : "text-white/60"
            )}
          >
            <div className="w-4 h-4 flex items-center justify-center">
              {!selectedAccountId && <Check className="w-3.5 h-3.5 text-orange-400" />}
            </div>
            <span>Todas las cuentas</span>
          </button>

          {/* Separator */}
          <div className="h-px bg-white/[0.04] mx-2 my-0.5" />

          {filteredAccounts.length === 0 ? (
            <div className="px-3 py-4 text-xs text-white/25 text-center">No se encontraron cuentas</div>
          ) : (
            filteredAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-white/[0.04] transition-colors duration-100",
                  selectedAccountId === account.id ? "text-orange-400" : "text-white/60"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  {selectedAccountId === account.id && <Check className="w-3.5 h-3.5 text-orange-400" />}
                </div>
                <div className={cn("w-2 h-2 rounded-full shrink-0", PLATFORM_COLORS[account.platform] || "bg-gray-500")} />
                <div className="flex-1 truncate">
                  <span className="text-white/80">{getDisplayName(account)}</span>
                </div>
                <span className="text-white/25 shrink-0 text-[10px]">{PLATFORM_LABELS[account.platform] || account.platform}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
