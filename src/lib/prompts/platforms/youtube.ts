import type { PlatformPromptConfig } from "./index";

export const youtubeConfig: PlatformPromptConfig = {
  name: "YouTube Ads",
  specs: `- Hook: primeros 5 segundos (antes del botón "Saltar anuncio")
- Primary text: guión del anuncio (15-30 segundos recomendado)
- Headline: para el companion banner lateral
- CTA: claro al final del video + overlay clickable
- Bumper ads: máximo 6 segundos, sin skip`,
  bestPractices: `- Los primeros 5 segundos definen todo: si no enganchas, pierdes
- Abre con la persona hablando directo a cámara o un visual impactante
- No guardes el mensaje principal para el final
- Subtítulos siempre: 85% ve videos sin sonido en mobile
- El companion banner debe reforzar la oferta, no repetir el video
- Para remarketing: sé más directo, ya te conocen
- Shorts ads: vertical, <60s, estilo UGC similar a TikTok`,
  copywritingFormulas: ["AIDA", "Hook-Story-Offer", "Problem-Agitate-Solve"],
  outputFields: ["headline", "primaryText", "cta", "hook"],
};
