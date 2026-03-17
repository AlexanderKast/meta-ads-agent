import { NextRequest } from "next/server";
import { refineSchema } from "@/lib/validators";
import { buildRefinePrompt } from "@/lib/prompts/builder";
import { aiCall } from "@/lib/ai-provider";
import { generateAdsTool } from "@/lib/tool-schemas";

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
    const result = await aiCall(
      buildRefinePrompt(original, instruction, platform),
      generateAdsTool(),
      2048
    );
    const variations = result.variations as Array<Record<string, string>>;
    return Response.json(variations[0] || {});
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al refinar";
    return Response.json({ error: message }, { status: 500 });
  }
}
