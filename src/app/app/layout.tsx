import { Sidebar } from "@/components/layout/sidebar";
import { ToastContainer } from "@/components/ui/toast";
import { AccountProvider } from "@/contexts/account-context";
import { AccountSelector } from "@/components/layout/account-selector";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AccountProvider>
      <TooltipProvider>
        <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
              <AccountSelector />
              <span className="text-xs text-text-dim bg-surface px-3 py-1 rounded-full">Claude Ads</span>
            </header>
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
          <ToastContainer />
        </div>
      </TooltipProvider>
    </AccountProvider>
  );
}
