import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { scoreSchema } from "@/lib/validators";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { buildScorePrompt } from "@/lib/prompts/builder";

const client = new Anthropic();

const SCORE_TOOL: Anthropic.Tool = {
  name: "score_ad",
  description: "Score an ad variation on quality metrics",
  input_schema: {
    type: "object" as const,
    properties: {
      clarity: { type: "number", description: "Clarity score 0-100" },
      engagement: { type: "number", description: "Predicted engagement score 0-100" },
      ctaRelevance: { type: "number", description: "CTA relevance score 0-100" },
      platformCompliance: { type: "number", description: "Platform spec compliance 0-100" },
      overall: { type: "number", description: "Weighted overall score 0-100" },
      summary: { type: "string", description: "1-2 line summary of the evaluation" },
    },
    required: ["clarity", "engagement", "ctaRelevance", "platformCompliance", "overall", "summary"],
  },
};

export async function POST(request: NextRequest) {
  const parseResult = scoreSchema.safeParse(await request.json());

  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const { variation, platform, objective } = parseResult.data;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [SCORE_TOOL],
      tool_choice: { type: "tool", name: "score_ad" },
      messages: [
        { role: "user", content: buildScorePrompt(variation, platform, objective) },
      ],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return Response.json({ error: "Error al evaluar" }, { status: 500 });
    }

    return Response.json(toolBlock.input);
  } catch (err) {
    const message = err instanceof Anthropic.APIError
      ? `Error de Claude: ${err.message}`
      : "Error al evaluar";
    return Response.json({ error: message }, { status: 500 });
  }
}
