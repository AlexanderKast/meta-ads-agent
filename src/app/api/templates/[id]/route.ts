import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return Response.json({ error: "No encontrado" }, { status: 404 });

  return Response.json(data);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

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
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const { error } = await supabase.from("templates").delete().eq("id", id).eq("user_id", user.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
