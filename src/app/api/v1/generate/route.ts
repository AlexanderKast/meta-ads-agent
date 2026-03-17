import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { adRequestSchema } from "@/lib/validators";
import { SYSTEM_PROMPT } from "@/lib/prompts/system";
import { buildPrompt } from "@/lib/prompts/builder";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

const TOOL_DEFINITION: Anthropic.Tool = {
  name: "generate_ads",
  description: "Generate ad variations with tips",
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
      tips: { type: "array", items: { type: "string" } },
    },
    required: ["variations", "tips"],
  },
};

async function validateApiKey(key: string): Promise<string | null> {
  const supabase = await createClient();
  const keyHash = createHash("sha256").update(key).digest("hex");

  const { data } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  if (!data) return null;

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash);

  return data.user_id;
}

export async function POST(request: NextRequest) {
  // Auth via API key
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return Response.json({ error: "API key required. Use Authorization: Bearer YOUR_KEY" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  // Rate limit
  const rateCheck = checkRateLimit(userId, "agency");
  if (!rateCheck.allowed) {
    return Response.json(
      { error: "Rate limit exceeded", resetIn: rateCheck.resetIn },
      { status: 429 }
    );
  }

  // Validate body
  const parseResult = adRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return Response.json(
      { error: parseResult.error.issues.map((e) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const body = parseResult.data;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: [TOOL_DEFINITION],
      tool_choice: { type: "tool", name: "generate_ads" },
      messages: [{ role: "user", content: buildPrompt(body) }],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return Response.json({ error: "Generation failed" }, { status: 500 });
    }

    return Response.json({
      platform: body.platform,
      ...(toolBlock.input as object),
    });
  } catch (err) {
    const message = err instanceof Anthropic.APIError ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}
