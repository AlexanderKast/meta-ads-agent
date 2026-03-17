import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", getUserId())
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  const body = await request.json();

  const { data, error } = await supabase.from("templates").insert({
    user_id: getUserId(),
    name: body.name,
    platform: body.platform,
    objective: body.objective,
    tone: body.tone,
    product_template: body.product_template,
    audience_template: body.audience_template,
    extras: body.extras,
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 201 });
}
