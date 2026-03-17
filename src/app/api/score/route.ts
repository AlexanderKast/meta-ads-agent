import { NextRequest } from "next/server";
import { scoreSchema } from "@/lib/validators";
import { buildScorePrompt } from "@/lib/prompts/builder";
import { aiCall } from "@/lib/ai-provider";
import { scoreAdTool } from "@/lib/tool-schemas";

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
    const result = await aiCall(
      buildScorePrompt(variation, platform, objective),
      scoreAdTool,
      1024
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al evaluar";
    return Response.json({ error: message }, { status: 500 });
  }
}
