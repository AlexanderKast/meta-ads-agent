"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  Bot,
  Megaphone,
  BarChart3,
  Palette,
  Brain,
  FileBarChart,
  History,
  FolderOpen,
  Diamond,
  Plug,
  Rocket,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/generate", label: "Generar", icon: Sparkles },
      { href: "/app/agent", label: "Agente IA", icon: Bot },
    ],
  },
  {
    title: "Campanas",
    items: [
      { href: "/app/campaigns", label: "Campanas", icon: Megaphone },
      { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/app/library", label: "Creativos", icon: Palette },
      { href: "/app/strategy", label: "Estrategia", icon: Brain },
      { href: "/app/reports", label: "Reportes", icon: FileBarChart },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/app/history", label: "Historial", icon: History },
      { href: "/app/templates", label: "Templates", icon: FolderOpen },
      { href: "/app/brand", label: "Marca", icon: Diamond },
    ],
  },
  {
    title: "Config",
    items: [
      { href: "/app/integrations", label: "Integraciones", icon: Plug },
      { href: "/app/optimize", label: "Optimizar", icon: Rocket },
      { href: "/app/billing", label: "Facturacion", icon: CreditCard },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col min-h-screen border-r border-white/[0.06] bg-[#0c0c0f]/80 backdrop-blur-xl transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Gradient border effect on the right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/20 via-pink-500/10 to-transparent" />

      {/* Logo area */}
      <div className={cn("flex items-center gap-2.5 px-3 h-14 shrink-0", collapsed && "justify-center px-0")}>
        <Link href="/" className={cn("flex items-center gap-2.5", collapsed && "justify-center")}>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-lg shadow-orange-500/20">
            CA
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-white tracking-tight">Claude Ads</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 overflow-hidden">
        <nav className={cn("py-2 space-y-4", collapsed ? "px-1.5" : "px-2")}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-2 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.08em] text-white/30 font-medium select-none">
                  {section.title}
                </div>
              )}
              {collapsed && <div className="h-px bg-white/[0.04] mx-1 my-1" />}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-all duration-150",
                        collapsed ? "justify-center h-9 w-9 mx-auto" : "px-2 py-1.5",
                        isActive
                          ? "text-orange-400"
                          : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                      )}
                    >
                      {/* Active indicator - left glow bar */}
                      {isActive && (
                        <div
                          className={cn(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]",
                            collapsed ? "h-4 -left-1.5" : "h-4"
                          )}
                        />
                      )}

                      <Icon
                        className={cn(
                          "shrink-0 transition-colors duration-150",
                          collapsed ? "w-[18px] h-[18px]" : "w-4 h-4",
                          isActive
                            ? "text-orange-400"
                            : "text-white/40 group-hover:text-white/70"
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger render={<div />}>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className={cn("shrink-0 border-t border-white/[0.04] p-2", collapsed && "flex justify-center")}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full h-8 rounded-md text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-150"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
