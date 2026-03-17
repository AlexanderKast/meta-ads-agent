import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PLANS } from "@/lib/plans";
import Link from "next/link";

export const metadata = {
  title: "Precios - Claude Ads",
  description: "Planes y precios de Claude Ads. Genera copy publicitario profesional desde $0/mes.",
};

function Check() {
  return <span className="text-success">✓</span>;
}

function Cross() {
  return <span className="text-text-dim">-</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Precios simples, valor real</h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Empieza gratis. Escala cuando lo necesites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLANS).map(([id, plan]) => (
            <div
              key={id}
              className={`rounded-2xl border p-8 space-y-6 ${
                id === "pro"
                  ? "border-primary bg-primary/5 relative"
                  : "border-border bg-surface"
              }`}
            >
              {id === "pro" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                  Popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  ${plan.priceMonthly}
                  <span className="text-sm text-text-dim font-normal">/mes</span>
                </p>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-text-secondary">
                  <Check />
                  {plan.generations === Infinity ? "Generaciones ilimitadas" : `${plan.generations} generaciones/mes`}
                </li>
                <li className="flex items-center gap-2 text-text-secondary">
                  <Check />
                  {plan.platforms === "all" ? "8 plataformas" : "4 plataformas"}
                </li>
                <li className="flex items-center gap-2 text-text-secondary">
                  <Check />
                  {plan.brandProfiles === Infinity ? "Perfiles ilimitados" : `${plan.brandProfiles} perfil de marca`}
                </li>
                <li className="flex items-center gap-2 text-text-secondary">
                  {plan.export ? <Check /> : <Cross />}
                  Exportar CSV/JSON
                </li>
                <li className="flex items-center gap-2 text-text-secondary">
                  {plan.api ? <Check /> : <Cross />}
                  API publica
                </li>
                <li className="flex items-center gap-2 text-text-secondary">
                  {plan.teamMembers > 0 ? <Check /> : <Cross />}
                  {plan.teamMembers === Infinity ? "Equipo ilimitado" : plan.teamMembers > 0 ? `${plan.teamMembers} miembros` : "Sin equipo"}
                </li>
              </ul>

              <Link
                href={id === "free" ? "/login" : "/app/billing"}
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  id === "pro"
                    ? "bg-gradient-to-r from-primary to-secondary text-white hover:from-primary-hover hover:to-pink-700"
                    : "border border-border text-text-secondary hover:bg-surface-hover"
                }`}
              >
                {id === "free" ? "Empezar gratis" : `Elegir ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
