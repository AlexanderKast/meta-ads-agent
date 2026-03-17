import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";

const client = new Anthropic();

const schema = z.object({
  adCopy: z.string().min(1).max(2000),
  metrics: z.string().min(1).max(2000),
});

const OPTIMIZE_TOOL: Anthropic.Tool = {
  name: "optimize_ad",
  description: "Analyze and optimize an underperforming ad",
  input_schema: {
    type: "object" as const,
    properties: {
      analysis: { type: "string", description: "Overall diagnostic of why the ad underperforms" },
      issues: { type: "array", items: { type: "string" }, description: "Specific problems identified" },
      recommendations: { type: "array", items: { type: "string" }, description: "Actionable recommendations" },
      optimizedVariations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            headline: { type: "string" },
            primaryText: { type: "string" },
            description: { type: "string" },
            cta: { type: "string" },
            hook: { type: "string" },
          },
          required: ["headline", "primaryText", "cta"],
        },
      },
    },
    required: ["analysis", "issues", "recommendations", "optimizedVariations"],
  },
};

export async function POST(request: NextRequest) {
  const parseResult = schema.safeParse(await request.json());
  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues.map((e) => e.message).join(", ") }, { status: 400 });
  }

  const { adCopy, metrics } = parseResult.data;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [OPTIMIZE_TOOL],
      tool_choice: { type: "tool", name: "optimize_ad" },
      messages: [{
        role: "user",
        content: `Analiza este anuncio que no esta performando bien y genera variaciones optimizadas.

**COPY ACTUAL:**
${adCopy}

**METRICAS:**
${metrics}

Identifica por que no performa, que problemas tiene, da recomendaciones concretas y genera 3 variaciones optimizadas.

Usa la herramienta optimize_ad para responder.`,
      }],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return Response.json({ error: "Error en la optimizacion" }, { status: 500 });
    }

    return Response.json(toolBlock.input);
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? `Error de Claude: ${err.message}` : "Error al optimizar";
    return Response.json({ error: message }, { status: 500 });
  }
}
