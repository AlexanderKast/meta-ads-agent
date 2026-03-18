import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/auth-helper";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, platform, accountId, accountName, accessToken, refreshToken, expiresAt } = body;

  if (!userId || !platform || !accessToken) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("connected_accounts")
    .upsert({
      user_id: userId,
      platform,
      platform_account_id: accountId || "default",
      account_name: accountName || `${platform} account`,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      token_expires_at: expiresAt || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform,platform_account_id" })
    .select("id, platform_account_id, account_name")
    .single();

  if (error) {
    return Response.json({ error: error.message, code: error.code, details: error.details }, { status: 500 });
  }

  return Response.json({ success: true, account: data });
}
