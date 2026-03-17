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
  const body = await request.json();

  // Support both: disconnect single account or all accounts for a platform
  const { accountId, platform } = body;

  if (platform) {
    // Disconnect all accounts for this platform
    const { error } = await supabase
      .from("connected_accounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("platform", platform);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, disconnected: "all", platform });
  }

  if (accountId) {
    const { error } = await supabase
      .from("connected_accounts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", accountId)
      .eq("user_id", userId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "accountId or platform required" }, { status: 400 });
}
