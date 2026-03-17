import type { PlatformPromptConfig } from "./index";

export const googleConfig: PlatformPromptConfig = {
  name: "Google Ads (Search)",
  specs: `- Headlines: hasta 3, máximo 30 caracteres cada uno
- Descriptions: hasta 2, máximo 90 caracteres cada una
- El CTA está implícito en el copy (no hay botón CTA separado)
- Incluir keywords relevantes de forma natural
- La URL visible puede customizarse (path1/path2)`,
  bestPractices: `- Headline 1 debe incluir la keyword principal
- Headline 2 refuerza el beneficio o la oferta
- Headline 3 es el CTA o diferenciador
- Las descriptions deben expandir los headlines, no repetirlos
- Usa números y datos específicos ("+50,000 clientes", "en 24h")
- Incluye extensiones de anuncio: sitelinks, callouts, snippets
- RSA (Responsive Search Ads): provee variedad para que Google optimice
- Negative keywords son tan importantes como las positivas`,
  copywritingFormulas: ["Feature-Benefit-CTA", "Problem-Solution", "Social Proof"],
  outputFields: ["headline", "primaryText", "description", "cta"],
};
