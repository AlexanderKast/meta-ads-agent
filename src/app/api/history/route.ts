import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from("generations")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ data, total: count, page, limit });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase.from("generations").insert({
    user_id: user.id,
    platform: body.platform,
    objective: body.objective,
    tone: body.tone,
    product: body.product,
    audience: body.audience,
    extras: body.extras,
    variations_count: body.variations_count,
    result: body.result,
    tokens_used: body.tokens_used || 0,
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 201 });
}
