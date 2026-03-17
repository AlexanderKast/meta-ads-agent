"use client";

import { useState, type FormEvent } from "react";
import type { Platform, Objective, Tone, Language, AdRequest } from "@/lib/types";
import { LIMITS } from "@/lib/constants";
import { PlatformSelector } from "./platform-selector";
import { ObjectiveSelector } from "./objective-selector";
import { ToneSelector } from "./tone-selector";
import { LanguageSelector } from "./language-selector";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdFormProps {
  onSubmit: (request: AdRequest) => void;
  isLoading: boolean;
}

export function AdForm({ onSubmit, isLoading }: AdFormProps) {
  const [platform, setPlatform] = useState<Platform>("meta");
  const [objective, setObjective] = useState<Objective>("conversion");
  const [tone, setTone] = useState<Tone>("profesional");
  const [language, setLanguage] = useState<Language>("es");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [extras, setExtras] = useState("");
  const [variations, setVariations] = useState(3);
  const [generateImagePrompts, setGenerateImagePrompts] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      platform,
      objective,
      tone,
      product,
      audience,
      extras,
      variations,
      language,
      generateImagePrompts,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PlatformSelector value={platform} onChange={setPlatform} />

      <Textarea
        label="Producto / Servicio *"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="Ej: Curso de marketing digital para emprendedores, precio $97 USD, incluye 40+ lecciones en video..."
        rows={3}
        required
        charCount={{ current: product.length, max: LIMITS.product }}
      />

      <Textarea
        label="Audiencia objetivo *"
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        placeholder="Ej: Emprendedores 25-45 anos en LATAM, interesados en marketing digital..."
        rows={2}
        required
        charCount={{ current: audience.length, max: LIMITS.audience }}
      />

      <ObjectiveSelector value={objective} onChange={setObjective} />
      <ToneSelector value={tone} onChange={setTone} />
      <LanguageSelector value={language} onChange={setLanguage} />

      <Textarea
        label="Notas adicionales"
        value={extras}
        onChange={(e) => setExtras(e.target.value)}
        placeholder="Ofertas especiales, keywords, restricciones, estilo de marca..."
        rows={2}
      />

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Variaciones: {variations}
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={variations}
          onChange={(e) => setVariations(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-dim mt-1">
          <span>1</span>
          <span>5</span>
        </div>
      </div>

      {/* Image Prompts Toggle */}
      <button
        type="button"
        onClick={() => setGenerateImagePrompts(!generateImagePrompts)}
        className={cn(
          "w-full p-3 rounded-xl border text-left text-sm transition-all flex items-center gap-3",
          generateImagePrompts
            ? "border-primary bg-primary-light text-text-primary"
            : "border-border bg-surface text-text-muted hover:border-border-hover"
        )}
      >
        <div
          className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
            generateImagePrompts ? "border-primary bg-primary" : "border-border"
          )}
        >
          {generateImagePrompts && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div>
          <span className="font-medium">Generar prompts de imagen</span>
          <span className="text-text-dim block text-xs">Incluye descripciones para DALL-E / Midjourney</span>
        </div>
      </button>

      <Button type="submit" size="lg" loading={isLoading} className="w-full">
        {isLoading ? "Claude esta escribiendo..." : "Generar Anuncios"}
      </Button>
    </form>
  );
}
