import type { PlatformPromptConfig } from "./index";

export const twitterConfig: PlatformPromptConfig = {
  name: "X/Twitter Ads",
  specs: `- Tweet text: max 280 chars (recomendado <100 para engagement)
- Headline de website card: max 70 chars
- Description de website card: max 200 chars (2 lineas visibles)
- CTA: implicito en copy + boton de card
- Imagen: 800x418 (1.91:1) o 800x800 (1:1)`,
  bestPractices: `- Brevedad es clave: los tweets cortos (<100 chars) tienen mejor CTR
- Usa un tono conversacional y directo
- Los threads funcionan para contenido educativo/storytelling
- Las preguntas generan engagement (quote tweets, replies)
- Trending topics y hashtags relevantes amplian alcance organico
- Los tweets con imagen/video obtienen 2-3x mas engagement
- Evita exceso de hashtags: 1-2 es optimo para ads
- La autenticidad gana: evita lenguaje corporativo rigido
- Promoted tweets deben parecer contenido organico`,
  copywritingFormulas: ["Hook-Punch", "Question-Answer", "Hot-Take", "Thread-Story"],
  outputFields: ["headline", "primaryText", "cta", "hook"],
};
