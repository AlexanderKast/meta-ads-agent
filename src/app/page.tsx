"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdForm } from "@/components/forms/ad-form";
import { AdResults } from "@/components/ads/ad-results";
import { ToastContainer } from "@/components/ui/toast";
import { useGenerate } from "@/hooks/use-generate";
import { useState } from "react";
import type { Objective } from "@/lib/types";

export default function Home() {
  const { generate, result, isStreaming, error } = useGenerate();
  const [variations, setVariations] = useState(3);
  const [objective, setObjective] = useState<Objective>("conversion");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <AdForm
              onSubmit={(req) => {
                setVariations(req.variations);
                setObjective(req.objective);
                generate(req);
              }}
              isLoading={isStreaming}
            />
          </div>

          <div className="lg:col-span-3">
            <AdResults
              result={result}
              isStreaming={isStreaming}
              error={error}
              variations={variations}
              objective={objective}
            />
          </div>
        </div>
      </main>

      <Footer />
      <ToastContainer />
    </div>
  );
}
