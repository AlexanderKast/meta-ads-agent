import { NextRequest } from "next/server";
import { z } from "zod";
import { aiCall } from "@/lib/ai-provider";
import { optimizeAdTool } from "@/lib/tool-schemas";

const schema = z.object({
  adCopy: z.string().min(1).max(2000),
  metrics: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const parseResult = schema.safeParse(await request.json());
  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues.map((e) => e.message).join(", ") }, { status: 400 });
  }

  const { adCopy, metrics } = parseResult.data;

  try {
    const result = await aiCall(
      `Analiza este anuncio que no esta performando bien y genera variaciones optimizadas.

**COPY ACTUAL:**
${adCopy}

**METRICAS:**
${metrics}

Identifica por que no performa, que problemas tiene, da recomendaciones concretas y genera 3 variaciones optimizadas.

Usa la herramienta optimize_ad para responder.`,
      optimizeAdTool,
      { maxTokens: 8192, thinking: 2048, temperature: 0.8 }
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al optimizar";
    return Response.json({ error: message }, { status: 500 });
  }
}
