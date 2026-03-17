import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { adRequestSchema } from "@/lib/validators";
import { buildPrompt } from "@/lib/prompts/builder";
import { aiCall } from "@/lib/ai-provider";
import { generateAdsTool } from "@/lib/tool-schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

async function validateApiKey(key: string): Promise<string | null> {
  const supabase = await createClient();
  const keyHash = createHash("sha256").update(key).digest("hex");

  const { data } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();

  if (!data) return null;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key_hash", keyHash);

  return data.user_id;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "");

  if (!apiKey) {
    return Response.json({ error: "API key required. Use Authorization: Bearer YOUR_KEY" }, { status: 401 });
  }

  const userId = await validateApiKey(apiKey);
  if (!userId) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const rateCheck = checkRateLimit(userId, "agency");
  if (!rateCheck.allowed) {
    return Response.json({ error: "Rate limit exceeded", resetIn: rateCheck.resetIn }, { status: 429 });
  }

  const parseResult = adRequestSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return Response.json({ error: parseResult.error.issues.map((e) => e.message).join(", ") }, { status: 400 });
  }

  const body = parseResult.data;

  try {
    const result = await aiCall(buildPrompt(body), generateAdsTool());
    return Response.json({ platform: body.platform, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json({ error: message }, { status: 500 });
  }
}
