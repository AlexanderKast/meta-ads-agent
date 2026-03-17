import type { AdRequest, Language } from "@/lib/types";
import { getPlatformConfig } from "./platforms";
import { getObjectiveModifier, getToneModifier } from "./modifiers";

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  es: "Genera todo el copy en ESPANOL.",
  en: "Generate all copy in ENGLISH.",
  pt: "Gere todo o copy em PORTUGUES.",
  fr: "Generez tout le copy en FRANCAIS.",
};

export function buildPrompt(request: AdRequest): string {
  const platform = getPlatformConfig(request.platform);
  const objectiveMod = getObjectiveModifier(request.objective);
  const toneMod = getToneModifier(request.tone);
  const lang = request.language || "es";

  const imagePromptSection = request.generateImagePrompts
    ? `\n**PROMPTS DE IMAGEN:**
Para cada variacion, genera tambien un campo "imagePrompt" con una descripcion detallada de la imagen/video que acompanaria el anuncio. El prompt debe ser util para generar con DALL-E, Midjourney o Gemini Image. Incluye: composicion, colores, estilo visual, elementos clave, mood.`
    : "";

  return `Genera ${request.variations} variaciones de anuncios para ${platform.name}.

**IDIOMA:** ${LANGUAGE_INSTRUCTIONS[lang]}

**PRODUCTO/SERVICIO:**
${request.product}

**AUDIENCIA OBJETIVO:**
${request.audience}

${objectiveMod}

${toneMod}

**SPECS DE LA PLATAFORMA:**
${platform.specs}

**BEST PRACTICES:**
${platform.bestPractices}

**FORMULAS DE COPYWRITING A CONSIDERAR:**
${platform.copywritingFormulas.join(", ")}

${request.extras ? `**NOTAS ADICIONALES:**\n${request.extras}` : ""}
${imagePromptSection}

Genera exactamente ${request.variations} variaciones distintas. Cada una debe usar un angulo diferente (beneficio distinto, emocion distinta, estructura distinta).

Tambien incluye 3 tips especificos para optimizar estos anuncios en ${platform.name}.

Usa la herramienta generate_ads para responder.`;
}

export function buildAnalyzePrompt(adText: string, platform?: string): string {
  const platformNote = platform ? `La plataforma original es ${platform}.` : "";
  return `Analiza el siguiente anuncio publicitario y proporciona un analisis detallado.
${platformNote}

**TEXTO DEL ANUNCIO:**
${adText}

Identifica:
1. Fortalezas del copy (que funciona bien)
2. Debilidades (que se puede mejorar)
3. Genera 3 variaciones mejoradas manteniendo la intencion original
4. 3 tips especificos de mejora

Usa la herramienta analyze_ad para responder.`;
}

export function buildABTestPrompt(variations: string[], platform: string, objective: string, budget?: string): string {
  const variationsText = variations.map((v, i) => `Variacion ${i + 1}:\n${v}`).join("\n\n");
  const budgetNote = budget ? `\nPresupuesto disponible: ${budget}` : "";

  return `Analiza estas variaciones de anuncios para un A/B test en ${platform}, objetivo ${objective}.${budgetNote}

${variationsText}

Para cada variacion genera una hipotesis de performance. Indica cual crees que ganara y por que. Recomienda metricas a trackear, duracion del test y tamano de muestra.

Usa la herramienta ab_test_analysis para responder.`;
}

export function buildRefinePrompt(original: Record<string, string | undefined>, instruction: string, platform: string): string {
  const fields = Object.entries(original)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return `Refina el siguiente anuncio para ${platform} segun la instruccion del usuario.

**ANUNCIO ORIGINAL:**
${fields}

**INSTRUCCION:**
${instruction}

Genera una version refinada manteniendo la esencia pero aplicando la instruccion. Usa la herramienta generate_ads con una sola variacion y tips vacios.`;
}

export function buildScorePrompt(variation: Record<string, string | undefined>, platform: string, objective: string): string {
  const fields = Object.entries(variation)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  return `Evalua la calidad de este anuncio para ${platform} con objetivo ${objective}.

${fields}

Califica de 0-100 en cada categoria:
- clarity: claridad del mensaje
- engagement: potencial de engagement predicho
- ctaRelevance: relevancia y fuerza del CTA
- platformCompliance: cumplimiento de specs de la plataforma

Calcula un overall (promedio ponderado) y agrega un summary de 1-2 lineas.

Usa la herramienta score_ad para responder.`;
}
