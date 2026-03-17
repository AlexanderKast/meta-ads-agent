"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface UsageData {
  plan: string;
  generationsUsed: number;
  generationsLimit: number;
}

export default function DashboardPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage").then((r) => r.json()).then(setUsage).catch(() => {});
  }, []);

  const pct = usage ? Math.min((usage.generationsUsed / usage.generationsLimit) * 100, 100) : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="bordered" className="space-y-2">
          <span className="text-xs text-text-dim">Plan actual</span>
          <p className="text-2xl font-bold text-primary capitalize">{usage?.plan || "free"}</p>
        </Card>

        <Card variant="bordered" className="space-y-2">
          <span className="text-xs text-text-dim">Generaciones este mes</span>
          <p className="text-2xl font-bold text-text-primary">
            {usage?.generationsUsed || 0}
            <span className="text-sm text-text-dim font-normal">
              /{usage?.generationsLimit === Infinity ? "∞" : usage?.generationsLimit || 10}
            </span>
          </p>
          <div className="w-full bg-surface rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Card>

        <Card variant="bordered" className="space-y-2">
          <span className="text-xs text-text-dim">Acciones rapidas</span>
          <div className="space-y-2">
            <Link
              href="/app/generate"
              className="block text-sm text-primary hover:text-primary-hover transition-colors"
            >
              ✨ Generar anuncios
            </Link>
            <Link
              href="/app/templates"
              className="block text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              📁 Ver templates
            </Link>
            <Link
              href="/app/history"
              className="block text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              📋 Ver historial
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
