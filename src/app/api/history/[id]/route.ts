import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("id", id)
    .eq("user_id", getUserId())
    .single();

  if (error) return Response.json({ error: "No encontrado" }, { status: 404 });

  return Response.json(data);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("generations")
    .delete()
    .eq("id", id)
    .eq("user_id", getUserId());

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
