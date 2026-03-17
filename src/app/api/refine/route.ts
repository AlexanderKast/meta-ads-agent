import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { refineSchema } from "@/lib/validators";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { buildRefinePrompt } from "@/lib/prompts/builder";

const client = new Anthropic();

const REFINE_TOOL: Anthropic.Tool = {
  name: "generate_ads",
  description: "Generate refined ad variation",
  input_schema: {
    type: "object" as const,
    properties: {
      variations: {
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
      tips: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["variations", "tips"],
  },
};

export async function POST(request: NextRequest) {
  const parseResult = refineSchema.safeParse(await request.json());

  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const { original, instruction, platform } = parseResult.data;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [REFINE_TOOL],
      tool_choice: { type: "tool", name: "generate_ads" },
      messages: [
        { role: "user", content: buildRefinePrompt(original, instruction, platform) },
      ],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return Response.json({ error: "Error al refinar" }, { status: 500 });
    }

    const result = toolBlock.input as { variations: Array<Record<string, string>> };
    return Response.json(result.variations[0] || {});
  } catch (err) {
    const message = err instanceof Anthropic.APIError
      ? `Error de Claude: ${err.message}`
      : "Error al refinar";
    return Response.json({ error: message }, { status: 500 });
  }
}
