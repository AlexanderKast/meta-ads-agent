import type { Objective, Tone } from "@/lib/types";

const OBJECTIVE_MODIFIERS: Record<Objective, string> = {
  awareness: `OBJETIVO: AWARENESS (TOFU - Top of Funnel)
- El usuario NO conoce tu producto aún
- Prioriza: reconocimiento de marca, alcance, impresión memorable
- Evita: CTAs agresivos de venta, precios, ofertas directas
- Enfoque: educar, inspirar, generar curiosidad
- Métricas clave: impresiones, alcance, video views`,

  consideration: `OBJETIVO: CONSIDERATION (MOFU - Middle of Funnel)
- El usuario ya sabe que tiene un problema/necesidad
- Prioriza: diferenciación, beneficios específicos, proof points
- Enfoque: comparar, demostrar valor, generar leads
- CTAs: Más información, Descargar guía, Ver demo, Registrarse gratis
- Métricas clave: CTR, leads, engagement`,

  conversion: `OBJETIVO: CONVERSION (BOFU - Bottom of Funnel)
- El usuario está listo para comprar/actuar
- Prioriza: urgencia, oferta clara, eliminar objeciones
- Enfoque: precio, garantía, testimonios, escasez real
- CTAs: Comprar ahora, Empezar hoy, Obtener descuento, Registrarse
- Métricas clave: conversiones, ROAS, CPA`,
};

const TONE_MODIFIERS: Record<Tone, string> = {
  profesional: `TONO: PROFESIONAL
- Lenguaje formal pero accesible, sin jerga innecesaria
- Transmite autoridad y confianza
- Usa datos y estadísticas cuando sea posible
- Evita: exclamaciones excesivas, emojis informales, slang`,

  casual: `TONO: CASUAL / ORGÁNICO
- Como si un amigo te recomendara algo
- Lenguaje conversacional, contracciones naturales
- Puede incluir emojis sutiles
- Debe parecer contenido orgánico, no publicidad`,

  urgente: `TONO: URGENTE / ESCASEZ
- Crea sensación de oportunidad limitada
- Usa: "últimas horas", "solo quedan X", "precio especial termina"
- IMPORTANTE: la escasez debe ser creíble, no falsa
- Combina urgencia con el beneficio principal`,

  emocional: `TONO: EMOCIONAL / STORYTELLING
- Conecta con aspiraciones, miedos o deseos profundos
- Usa narrativa: antes/después, transformación, testimonio
- Apela a la identidad del usuario ("Para los que no se conforman...")
- El producto es el vehículo, no el protagonista`,

  divertido: `TONO: DIVERTIDO / TRENDING
- Humor inteligente, nunca ofensivo
- Puede usar memes, referencias culturales actuales
- Auto-deprecación funciona bien
- El entretenimiento es el gancho, el producto es la recompensa`,
};

export function getObjectiveModifier(objective: Objective): string {
  return OBJECTIVE_MODIFIERS[objective];
}

export function getToneModifier(tone: Tone): string {
  return TONE_MODIFIERS[tone];
}
