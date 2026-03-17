import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabase();

  const { error } = await supabase.from("api_keys").delete().eq("id", id).eq("user_id", getUserId());
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
