import { NextRequest } from "next/server";
import { abTestSchema } from "@/lib/validators";
import { buildABTestPrompt } from "@/lib/prompts/builder";
import { aiCall } from "@/lib/ai-provider";
import { abTestTool } from "@/lib/tool-schemas";

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
    const result = await aiCall(
      buildABTestPrompt(variations, platform, objective, budget),
      abTestTool
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al analizar";
    return Response.json({ error: message }, { status: 500 });
  }
}
