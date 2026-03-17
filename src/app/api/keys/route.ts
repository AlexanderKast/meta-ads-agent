import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { randomBytes, createHash } from "crypto";

function generateApiKey(): string {
  return "ca_" + randomBytes(32).toString("hex");
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, last_used_at, created_at, key_hash")
    .eq("user_id", getUserId())
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Return preview (first/last 4 chars simulated)
  const keys = (data || []).map((k) => ({
    ...k,
    key_preview: `ca_****${k.key_hash.slice(-8)}`,
  }));

  return Response.json(keys);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  const { name } = await request.json();
  const key = generateApiKey();
  const keyHash = hashKey(key);

  const { data, error } = await supabase.from("api_keys").insert({
    user_id: getUserId(),
    key_hash: keyHash,
    name: name || "Default",
  }).select("id, name, created_at, key_hash").single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    key, // Only returned once!
    apiKey: { ...data, key_preview: `ca_****${keyHash.slice(-8)}`, last_used_at: null },
  }, { status: 201 });
}
