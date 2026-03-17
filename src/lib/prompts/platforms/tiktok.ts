import type { PlatformPromptConfig } from "./index";

export const tiktokConfig: PlatformPromptConfig = {
  name: "TikTok Ads",
  specs: `- Ad text: máximo 80 caracteres para In-Feed
- Estilo: nativo, UGC, que NO parezca publicidad tradicional
- Hook: primeros 2-3 segundos, debe detener el scroll inmediatamente
- El copy es complemento del video, no el protagonista
- Hashtags: 2-3 relevantes máximo`,
  bestPractices: `- Piensa "creator first": el ad debe parecer un video orgánico
- Usa lenguaje de la plataforma (POV, storytime, un día en mi vida)
- Los Spark Ads (boosted organic) tienen mejor performance
- Lo-fi > Hi-fi: producción perfecta genera desconfianza
- Hook patterns que funcionan: pregunta controversial, dato sorprendente, "Nadie te dice esto sobre..."
- Trending sounds y formatos aumentan distribución
- El texto en pantalla es más importante que el caption`,
  copywritingFormulas: ["Hook-Story-Offer", "PAS", "Contrast"],
  outputFields: ["headline", "primaryText", "cta", "hook"],
};
