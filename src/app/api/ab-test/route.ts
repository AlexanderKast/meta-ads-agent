import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { abTestSchema } from "@/lib/validators";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { buildABTestPrompt } from "@/lib/prompts/builder";

const client = new Anthropic();

const AB_TEST_TOOL: Anthropic.Tool = {
  name: "ab_test_analysis",
  description: "Analyze ad variations for A/B testing",
  input_schema: {
    type: "object" as const,
    properties: {
      hypotheses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            variation: { type: "string", description: "Which variation this is about" },
            hypothesis: { type: "string", description: "Performance prediction and reasoning" },
            predictedWinner: { type: "boolean", description: "Whether this is predicted to win" },
            confidence: { type: "string", description: "Confidence level: low/medium/high" },
          },
          required: ["variation", "hypothesis", "predictedWinner", "confidence"],
        },
      },
      metricsToTrack: {
        type: "array",
        items: { type: "string" },
        description: "Key metrics to track during the test",
      },
      recommendedDuration: {
        type: "string",
        description: "How long to run the test",
      },
      sampleSize: {
        type: "string",
        description: "Recommended sample size per variation",
      },
    },
    required: ["hypotheses", "metricsToTrack", "recommendedDuration", "sampleSize"],
  },
};

export async function POST(request: NextRequest) {
  const parseResult = abTestSchema.safeParse(await request.json());

  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const { variations, platform, objective, budget } = parseResult.data;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [AB_TEST_TOOL],
      tool_choice: { type: "tool", name: "ab_test_analysis" },
      messages: [
        { role: "user", content: buildABTestPrompt(variations, platform, objective, budget) },
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
