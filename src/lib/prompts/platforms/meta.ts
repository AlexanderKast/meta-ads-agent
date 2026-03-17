import type { PlatformPromptConfig } from "./index";

export const metaConfig: PlatformPromptConfig = {
  name: "Meta Ads (Facebook + Instagram)",
  specs: `- Primary text: máximo 125 caracteres visible (sin "ver más"), puede extenderse
- Headline: máximo 40 caracteres
- Descripción: máximo 30 caracteres (aparece debajo del headline)
- CTA: de la lista oficial (Comprar, Más información, Registrarse, Descargar, Contactar)
- Hook: primera línea del copy que debe detener el scroll`,
  bestPractices: `- El primary text debe enganchar en la primera línea visible
- Usa emojis estratégicamente para romper el texto
- Los carousels tienen mejor CTR: piensa en secuencia narrativa
- Stories/Reels: copy corto, vertical, directo
- Segmentación amplia funciona mejor con Advantage+ (deja que el algoritmo optimice)
- Usa social proof cuando sea posible (reviews, números de clientes)`,
  copywritingFormulas: ["PAS", "AIDA", "BAB", "4Ps"],
  outputFields: ["headline", "primaryText", "description", "cta", "hook"],
};
