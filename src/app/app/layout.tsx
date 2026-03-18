"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ToastContainer } from "@/components/ui/toast";
import { AccountProvider } from "@/contexts/account-context";
import { AccountSelector } from "@/components/layout/account-selector";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import { Bell, Command } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/generate": "Generar",
  "/app/agent": "Agente IA",
  "/app/campaigns": "Campanas",
  "/app/analytics": "Analytics",
  "/app/library": "Creativos",
  "/app/strategy": "Estrategia",
  "/app/reports": "Reportes",
  "/app/history": "Historial",
  "/app/templates": "Templates",
  "/app/brand": "Marca",
  "/app/integrations": "Integraciones",
  "/app/optimize": "Optimizar",
  "/app/billing": "Facturacion",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] || "Claude Ads";

  return (
    <AccountProvider>
      <TooltipProvider>
        <div className="flex min-h-screen bg-[#0a0a0d]">
          {/* Subtle gradient mesh background */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/[0.02] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/[0.015] rounded-full blur-[100px]" />
          </div>

          <Sidebar />

          <div className="flex-1 flex flex-col relative z-0">
            {/* Header */}
            <header className="sticky top-0 z-20 h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.04] bg-[#0a0a0d]/80 backdrop-blur-xl">
              {/* Left: Page title / breadcrumb */}
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-white/25">app</span>
                <span className="text-white/15">/</span>
                <span className="text-[13px] font-medium text-white/80">{pageTitle}</span>
              </div>

              {/* Center: Command palette trigger */}
              <button className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-full border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-200 cursor-pointer group">
                <Command className="w-3.5 h-3.5 text-white/25 group-hover:text-white/40 transition-colors" />
                <span className="text-xs text-white/25 group-hover:text-white/40 transition-colors">Buscar...</span>
                <div className="flex items-center gap-0.5 ml-2">
                  <kbd className="text-[10px] text-white/20 bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono leading-none">
                    &#8984;
                  </kbd>
                  <kbd className="text-[10px] text-white/20 bg-white/[0.04] border border-white/[0.06] rounded px-1 py-0.5 font-mono leading-none">
                    K
                  </kbd>
                </div>
              </button>

              {/* Right: Account selector + notifications + avatar */}
              <div className="flex items-center gap-2">
                <AccountSelector />

                {/* Notification bell */}
                <button className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150 relative">
                  <Bell className="w-4 h-4" />
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                </button>

                {/* User avatar */}
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500/80 to-pink-500/80 flex items-center justify-center text-[10px] font-semibold text-white cursor-pointer hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200">
                  U
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>

          <ToastContainer />
        </div>
      </TooltipProvider>
    </AccountProvider>
  );
}
