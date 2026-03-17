import { NextRequest } from "next/server";
import { adRequestSchema } from "@/lib/validators";
import { buildPrompt } from "@/lib/prompts/builder";
import { aiCall, isConfigured } from "@/lib/ai-provider";
import { generateAdsTool } from "@/lib/tool-schemas";

export async function POST(request: NextRequest) {
  const parseResult = adRequestSchema.safeParse(await request.json());

  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const body = parseResult.data;

  if (!isConfigured()) {
    return Response.json({ error: "API key no configurada" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const tool = generateAdsTool(body.generateImagePrompts);

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const result = await aiCall(buildPrompt(body), tool, {
          maxTokens: 8192,
          thinking: 1024,
          temperature: 1.0,
        });

        const variations = result.variations as Array<Record<string, unknown>>;
        const tips = result.tips as string[];

        for (let i = 0; i < variations.length; i++) {
          send({ type: "variation", data: variations[i], index: i });
        }

        send({ type: "tips", data: tips });
        send({ type: "done", data: "complete" });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al generar anuncios";
        send({ type: "error", data: message });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
