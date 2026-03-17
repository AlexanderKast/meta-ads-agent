"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name: string;
  is_active: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface AccountContextType {
  accounts: ConnectedAccount[];
  selectedAccountId: string | null;
  selectedAccount: ConnectedAccount | null;
  setSelectedAccountId: (id: string | null) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  accounts: [],
  selectedAccountId: null,
  selectedAccount: null,
  setSelectedAccountId: () => {},
  loading: true,
  refetch: async () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [selectedAccountId, setSelectedAccountIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/platforms/accounts");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setAccounts(list);

      // Restore from localStorage or default to first
      const saved = localStorage.getItem("selectedAccountId");
      if (saved && list.some((a: ConnectedAccount) => a.id === saved)) {
        setSelectedAccountIdState(saved);
      } else if (list.length > 0) {
        setSelectedAccountIdState(list[0].id);
        localStorage.setItem("selectedAccountId", list[0].id);
      }
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const setSelectedAccountId = (id: string | null) => {
    setSelectedAccountIdState(id);
    if (id) localStorage.setItem("selectedAccountId", id);
    else localStorage.removeItem("selectedAccountId");
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  return (
    <AccountContext.Provider value={{ accounts, selectedAccountId, selectedAccount, setSelectedAccountId, loading, refetch: fetchAccounts }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}
