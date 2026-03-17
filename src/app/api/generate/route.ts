import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { adRequestSchema } from "@/lib/validators";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { buildPrompt } from "@/lib/prompts/builder";

const client = new Anthropic();

function buildToolDefinition(includeImagePrompt: boolean): Anthropic.Tool {
  const variationProperties: Record<string, object> = {
    headline: { type: "string", description: "Ad headline" },
    primaryText: { type: "string", description: "Main ad copy" },
    description: { type: "string", description: "Short description (if applicable)" },
    cta: { type: "string", description: "Call to action" },
    hook: { type: "string", description: "Attention hook for first seconds" },
  };

  if (includeImagePrompt) {
    variationProperties.imagePrompt = {
      type: "string",
      description: "Detailed image generation prompt for DALL-E/Midjourney/Gemini",
    };
  }

  return {
    name: "generate_ads",
    description: "Generate ad variations with tips",
    input_schema: {
      type: "object" as const,
      properties: {
        variations: {
          type: "array",
          items: {
            type: "object",
            properties: variationProperties,
            required: ["headline", "primaryText", "cta"],
          },
        },
        tips: {
          type: "array",
          items: { type: "string" },
          description: "3 optimization tips",
        },
      },
      required: ["variations", "tips"],
    },
  };
}

export async function POST(request: NextRequest) {
  const parseResult = adRequestSchema.safeParse(await request.json());

  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const body = parseResult.data;

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "API key no configurada" }, { status: 401 });
  }

  const encoder = new TextEncoder();
  const toolDef = buildToolDefinition(body.generateImagePrompts);

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          tools: [toolDef],
          tool_choice: { type: "tool", name: "generate_ads" },
          messages: [{ role: "user", content: buildPrompt(body) }],
        });

        const toolBlock = response.content.find((block) => block.type === "tool_use");

        if (!toolBlock || toolBlock.type !== "tool_use") {
          send({ type: "error", data: "Claude no uso la herramienta esperada" });
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        const result = toolBlock.input as {
          variations: Array<{
            headline: string;
            primaryText: string;
            description?: string;
            cta: string;
            hook?: string;
            imagePrompt?: string;
          }>;
          tips: string[];
        };

        for (let i = 0; i < result.variations.length; i++) {
          send({ type: "variation", data: result.variations[i], index: i });
        }

        send({ type: "tips", data: result.tips });
        send({ type: "done", data: "complete" });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        const message =
          err instanceof Anthropic.APIError
            ? err.status === 429
              ? "Demasiadas solicitudes. Intenta en unos momentos."
              : `Error de Claude: ${err.message}`
            : "Error al generar anuncios";

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
