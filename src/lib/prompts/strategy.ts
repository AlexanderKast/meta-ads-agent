// Strategy prompts for Module 8: Strategy AI

interface CampaignData {
  name: string;
  platform: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  ctr: number;
  cpc: number;
}

interface BudgetMetrics {
  totalBudget: number;
  campaigns: Array<{
    name: string;
    platform: string;
    currentBudget: number;
    spend: number;
    roas: number;
    conversions: number;
    ctr: number;
  }>;
}

interface CopyData {
  headline: string;
  primaryText: string;
  cta: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

export function buildAuditPrompt(campaigns: CampaignData[]): string {
  const campaignList = campaigns
    .map(
      (c) =>
        `- ${c.name} (${c.platform}, ${c.status}): Spend $${c.spend.toFixed(2)}, ` +
        `Impressions ${c.impressions}, Clicks ${c.clicks}, CTR ${(c.ctr * 100).toFixed(2)}%, ` +
        `Conversions ${c.conversions}, ROAS ${c.roas.toFixed(2)}, CPC $${c.cpc.toFixed(2)}`
    )
    .join("\n");

  return `Eres un estratega de publicidad digital experto. Analiza el siguiente portafolio de campanas publicitarias y proporciona un audit completo.

CAMPANAS:
${campaignList}

INSTRUCCIONES:
1. Evalua la salud de cada campana con un healthScore de 0-100 basado en:
   - CTR vs benchmark de la plataforma
   - ROAS (>3 es bueno, >5 es excelente)
   - CPC relativo al mercado
   - Tendencia de conversiones
2. Identifica issues especificos para cada campana
3. Sugiere una accion concreta para cada campana
4. Asigna prioridad: "alta", "media", "baja"
5. Resume el estado general del portafolio
6. Lista las top 3 acciones mas impactantes

Responde en espanol.`;
}

export function buildBudgetPrompt(data: BudgetMetrics): string {
  const campaignList = data.campaigns
    .map(
      (c) =>
        `- ${c.name} (${c.platform}): Budget actual $${c.currentBudget.toFixed(2)}, ` +
        `Spend $${c.spend.toFixed(2)}, ROAS ${c.roas.toFixed(2)}, ` +
        `Conversions ${c.conversions}, CTR ${(c.ctr * 100).toFixed(2)}%`
    )
    .join("\n");

  return `Eres un experto en optimizacion de presupuesto publicitario. Analiza las siguientes campanas y recomienda como redistribuir el presupuesto total de $${data.totalBudget.toFixed(2)} para maximizar el ROAS.

CAMPANAS:
${campaignList}

INSTRUCCIONES:
1. Analiza que campanas tienen mejor rendimiento (ROAS, conversiones, CTR)
2. Recomienda un nuevo presupuesto para cada campana
3. Justifica cada recomendacion
4. Calcula el ahorro total estimado
5. Proyecta el ROAS general esperado con la redistribucion

Principios:
- Asigna mas presupuesto a campanas con ROAS alto
- Reduce presupuesto en campanas con ROAS < 1
- Considera mantener campanas de awareness con CTR alto aunque ROAS sea bajo
- No elimines campanas completamente, deja al menos 10% del budget original

Responde en espanol.`;
}

export function buildCopyTestPrompt(
  topCopies: CopyData[],
  worstCopies: CopyData[]
): string {
  const formatCopy = (c: CopyData) =>
    `  Platform: ${c.platform}\n  Headline: ${c.headline}\n  PrimaryText: ${c.primaryText}\n  CTA: ${c.cta}\n  CTR: ${(c.ctr * 100).toFixed(2)}% | Clicks: ${c.clicks} | Conversions: ${c.conversions}`;

  const winnersBlock = topCopies.map((c, i) => `Winner #${i + 1}:\n${formatCopy(c)}`).join("\n\n");
  const losersBlock = worstCopies.map((c, i) => `Loser #${i + 1}:\n${formatCopy(c)}`).join("\n\n");

  return `Eres un copywriter publicitario experto y analista de datos. Analiza los patrones en los copies ganadores vs perdedores y genera 5 nuevas variaciones basadas en lo que funciona.

COPIES GANADORES (mejor rendimiento):
${winnersBlock}

COPIES PERDEDORES (peor rendimiento):
${losersBlock}

INSTRUCCIONES:
1. Identifica patrones en los ganadores (que tienen en comun: longitud, tono, estructura, emociones, CTAs)
2. Identifica patrones en los perdedores (que tienen en comun que los hace fallar)
3. Genera 5 nuevas variaciones que combinen los patrones ganadores
4. Cada variacion debe tener: headline, primaryText, cta, hook, y un razonamiento de por que funcionaria

Responde en espanol.`;
}
