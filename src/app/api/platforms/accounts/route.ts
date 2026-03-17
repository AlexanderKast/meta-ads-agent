import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET() {
  const supabase = getSupabase();
  const userId = getUserId();

  const { data, error } = await supabase
    .from("connected_accounts")
    .select("id, platform, platform_account_id, account_name, is_active, created_at, token_expires_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();

  const { accountId } = await request.json();

  const { error } = await supabase
    .from("connected_accounts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
