import type { PlatformPromptConfig } from "./index";

export const microsoftConfig: PlatformPromptConfig = {
  name: "Microsoft/Bing Ads",
  specs: `- Headlines: hasta 3, max 30 chars cada uno (igual que Google)
- Descriptions: hasta 2, max 90 chars cada una
- CTA implicito en copy
- Audience Ads: headline max 40 chars, description max 90 chars
- Multimedia Ads: titulo largo max 90 chars
- Keywords naturales integradas`,
  bestPractices: `- La audiencia de Bing tiende a ser mayor (35+) y con mayor poder adquisitivo
- Desktop-first: mas busquedas desde escritorio que Google
- Menor competencia = CPC mas bajo, aprovechar con keywords broad
- Import desde Google Ads funciona pero optimiza para la audiencia Bing
- Las extensiones de anuncio tienen alta adoption rate aqui
- Microsoft Audience Network llega a LinkedIn, MSN y Outlook
- Copilot integration: los ads aparecen en respuestas de Copilot
- Usa un tono ligeramente mas formal que Google Ads
- Los numeros y ofertas especificas funcionan muy bien en search`,
  copywritingFormulas: ["Feature-Benefit-CTA", "Problem-Solution", "Value-Proposition", "Trust-Signal"],
  outputFields: ["headline", "primaryText", "description", "cta"],
};
