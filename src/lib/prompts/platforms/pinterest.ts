import type { PlatformPromptConfig } from "./index";

export const pinterestConfig: PlatformPromptConfig = {
  name: "Pinterest Ads",
  specs: `- Pin title: max 100 chars
- Pin description: max 500 chars (primeros 50-60 visibles)
- Idea Pins: hasta 20 paginas, texto overlay corto
- CTA: Integrado en el copy, no boton separado
- Imagen: 1000x1500 (2:3 ratio) recomendado`,
  bestPractices: `- Pinterest es un motor de busqueda visual: usa keywords naturales
- El contenido aspiracional e inspiracional funciona mejor
- Los usuarios estan en modo "planificacion" - apelar a futuros proyectos
- Los textos overlay deben ser legibles: maximo 4-6 palabras
- Rich Pins agregan contexto automatico desde tu sitio
- Temporalidad: publicar contenido estacional 30-45 dias antes
- Los tutoriales y paso-a-paso tienen alto save rate
- Evitar imagenes con mucho texto: Pinterest penaliza >20% texto`,
  copywritingFormulas: ["Aspirational-How", "List-Benefit", "Seasonal-Trigger", "Tutorial-Format"],
  outputFields: ["headline", "primaryText", "description", "cta"],
};
