import type { PlatformPromptConfig } from "./index";

export const linkedinConfig: PlatformPromptConfig = {
  name: "LinkedIn Ads",
  specs: `- Sponsored Content: headline max 70 chars, intro text max 150 chars visible
- Text Ads: headline max 25 chars, description max 75 chars
- InMail: subject max 60 chars, body max 1500 chars
- CTA: de la lista (Solicitar, Descargar, Obtener cotizacion, Mas informacion, Registrarse, Suscribirse)
- Imagen recomendada: 1200x627 para feed`,
  bestPractices: `- Tono profesional pero no corporativo aburrido
- Incluir estadisticas de industria o resultados de negocio
- Thought leadership funciona mejor que venta directa
- Los decision-makers responden a ROI, eficiencia y ventaja competitiva
- Lead Gen Forms nativos tienen mejor conversion que landing pages
- Segmentar por titulo de trabajo, industria y tamano de empresa
- El contenido educativo supera al promocional 3:1
- Los carousels documentales generan alto engagement`,
  copywritingFormulas: ["Problem-Solution", "Social Proof", "Authority-Benefit", "Challenge-Solution-Result"],
  outputFields: ["headline", "primaryText", "description", "cta"],
};
