"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Generar" },
  { href: "/analyze", label: "Analizar" },
  { href: "/ab-test", label: "A/B Test" },
  { href: "/pricing", label: "Precios" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg">
              CA
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Claude Ads</h1>
              <p className="text-xs text-text-muted">Generador de anuncios con IA</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary-light text-primary font-medium"
                    : "text-text-muted hover:text-text-primary hover:bg-surface"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/login"
            className="text-sm bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-xl font-medium hover:from-primary-hover hover:to-pink-700 transition-all"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>
  );
}
