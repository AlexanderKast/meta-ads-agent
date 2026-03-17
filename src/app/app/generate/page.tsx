"use client";

import { AdForm } from "@/components/forms/ad-form";
import { AdResults } from "@/components/ads/ad-results";
import { useGenerate } from "@/hooks/use-generate";
import { useState } from "react";
import type { Objective } from "@/lib/types";

export default function GeneratePage() {
  const { generate, result, isStreaming, error } = useGenerate();
  const [variations, setVariations] = useState(3);
  const [objective, setObjective] = useState<Objective>("conversion");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl">
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
  );
}
