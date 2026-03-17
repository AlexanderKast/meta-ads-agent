import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("user_id", getUserId())
    .single();

  if (error) return Response.json({ error: "No encontrado" }, { status: 404 });

  return Response.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const body = await request.json();

  const { data, error } = await supabase
    .from("templates")
    .update({
      name: body.name,
      platform: body.platform,
      objective: body.objective,
      tone: body.tone,
      product_template: body.product_template,
      audience_template: body.audience_template,
      extras: body.extras,
    })
    .eq("id", id)
    .eq("user_id", getUserId())
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from("templates").delete().eq("id", id).eq("user_id", getUserId());
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
