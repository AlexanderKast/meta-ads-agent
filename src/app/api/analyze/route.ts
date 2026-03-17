import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { analyzeSchema } from "@/lib/validators";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { buildAnalyzePrompt } from "@/lib/prompts/builder";

const client = new Anthropic();

const ANALYZE_TOOL: Anthropic.Tool = {
  name: "analyze_ad",
  description: "Analyze an ad and provide improvements",
  input_schema: {
    type: "object" as const,
    properties: {
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "What works well in the ad",
      },
      weaknesses: {
        type: "array",
        items: { type: "string" },
        description: "What can be improved",
      },
      improvements: {
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
        description: "Improved ad variations",
      },
      tips: {
        type: "array",
        items: { type: "string" },
        description: "Specific improvement tips",
      },
    },
    required: ["strengths", "weaknesses", "improvements", "tips"],
  },
};

export async function POST(request: NextRequest) {
  const parseResult = analyzeSchema.safeParse(await request.json());

  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const { adText, platform, variations } = parseResult.data;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [ANALYZE_TOOL],
      tool_choice: { type: "tool", name: "analyze_ad" },
      messages: [
        {
          role: "user",
          content: buildAnalyzePrompt(adText, platform) + `\nGenera ${variations} variaciones mejoradas.`,
        },
      ],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return Response.json({ error: "Error en el analisis" }, { status: 500 });
    }

    return Response.json(toolBlock.input);
  } catch (err) {
    const message = err instanceof Anthropic.APIError
      ? `Error de Claude: ${err.message}`
      : "Error al analizar";
    return Response.json({ error: message }, { status: 500 });
  }
}
