"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/app/generate", label: "Generar", icon: "✨" },
  { href: "/app/history", label: "Historial", icon: "📋" },
  { href: "/app/templates", label: "Templates", icon: "📁" },
  { href: "/app/brand", label: "Marca", icon: "🎨" },
  { href: "/app/optimize", label: "Optimizar", icon: "🚀" },
  { href: "/app/api-keys", label: "API Keys", icon: "🔑" },
  { href: "/app/team", label: "Equipo", icon: "👥" },
  { href: "/app/billing", label: "Facturacion", icon: "💳" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-background/50 min-h-screen p-4 space-y-1">
      <Link href="/" className="flex items-center gap-2 mb-6 px-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm">
          CA
        </div>
        <span className="text-lg font-bold text-text-primary">Claude Ads</span>
      </Link>

      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === item.href
              ? "bg-primary-light text-primary font-medium"
              : "text-text-muted hover:text-text-primary hover:bg-surface"
          )}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
