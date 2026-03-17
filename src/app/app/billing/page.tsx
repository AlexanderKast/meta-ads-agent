"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/plans";

interface UsageData {
  plan: string;
  generationsUsed: number;
  generationsLimit: number;
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage").then((r) => r.json()).then(setUsage).catch(() => {});
  }, []);

  async function handleUpgrade(planId: string) {
    setLoading(planId);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(null);
  }

  async function handlePortal() {
    setLoading("portal");
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(null);
  }

  const currentPlan = usage?.plan || "free";

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Facturacion</h1>

      <Card variant="bordered" className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-text-dim">Plan actual</span>
            <p className="text-xl font-bold text-primary capitalize">{currentPlan}</p>
          </div>
          {currentPlan !== "free" && (
            <Button variant="secondary" size="sm" loading={loading === "portal"} onClick={handlePortal}>
              Gestionar suscripcion
            </Button>
          )}
        </div>
        <p className="text-sm text-text-muted">
          {usage?.generationsUsed || 0} / {usage?.generationsLimit === Infinity ? "Ilimitadas" : usage?.generationsLimit || 10} generaciones este mes
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PLANS).map(([id, plan]) => (
          <Card
            key={id}
            variant={currentPlan === id ? "highlighted" : "bordered"}
            className="space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
              <p className="text-2xl font-bold text-primary">
                ${plan.priceMonthly}
                <span className="text-sm text-text-dim font-normal">/mes</span>
              </p>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="text-text-secondary">
                {plan.generations === Infinity ? "Generaciones ilimitadas" : `${plan.generations} generaciones/mes`}
              </li>
              <li className="text-text-secondary">
                {plan.brandProfiles === Infinity ? "Perfiles de marca ilimitados" : `${plan.brandProfiles} perfil(es) de marca`}
              </li>
              <li className="text-text-secondary">
                {plan.platforms === "all" ? "Todas las plataformas" : "4 plataformas"}
              </li>
              <li className="text-text-secondary">
                {plan.export ? "Exportar CSV/JSON" : "Sin exportar"}
              </li>
              <li className="text-text-secondary">
                {plan.api ? "API publica" : "Sin API"}
              </li>
            </ul>

            {currentPlan === id ? (
              <Badge variant="success">Plan actual</Badge>
            ) : plan.priceMonthly > 0 ? (
              <Button
                size="sm"
                className="w-full"
                loading={loading === id}
                onClick={() => handleUpgrade(id)}
              >
                Actualizar a {plan.name}
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
