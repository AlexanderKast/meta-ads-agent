import { NextRequest } from "next/server";
import { fbApi } from "@/lib/platforms/meta";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");
  const campaignId = searchParams.get("campaignId");

  if (!accountId || !campaignId) {
    return Response.json({ error: "accountId and campaignId required" }, { status: 400 });
  }

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();

  if (!account) return Response.json({ error: "Account not found" }, { status: 404 });

  const token = decryptToken(account.access_token);
  const data = await fbApi(
    `/${campaignId}/insights?fields=actions,action_values&time_range={"since":"2026-03-01","until":"2026-03-19"}`,
    token
  );

  return Response.json({
    raw: data.data,
    actionTypes: (data.data || []).flatMap((d: Record<string, unknown>) =>
      ((d.actions as Array<{ action_type: string; value: string }>) || []).map(a => ({
        action_type: a.action_type,
        value: a.value,
      }))
    ),
  });
}
