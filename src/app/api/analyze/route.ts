import { NextRequest } from "next/server";
import { analyzeSchema } from "@/lib/validators";
import { buildAnalyzePrompt } from "@/lib/prompts/builder";
import { aiCall } from "@/lib/ai-provider";
import { analyzeAdTool } from "@/lib/tool-schemas";

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
    const result = await aiCall(
      buildAnalyzePrompt(adText, platform) + `\nGenera ${variations} variaciones mejoradas.`,
      analyzeAdTool
    );
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al analizar";
    return Response.json({ error: message }, { status: 500 });
  }
}
