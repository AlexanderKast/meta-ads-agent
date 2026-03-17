import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAdsFromAccount } from "@/lib/platforms/meta";

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const accountId = request.nextUrl.searchParams.get("accountId");

  if (!accountId) {
    return Response.json({ error: "accountId requerido" }, { status: 400 });
  }

  // Get the Meta connection for this account
  const { data: account } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .eq("platform_account_id", accountId)
    .eq("is_active", true)
    .single();

  // Fallback: try any active meta connection (same token)
  const connection = account || (await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .eq("is_active", true)
    .limit(1)
    .single()).data;

  if (!connection) {
    return Response.json({ error: "Meta no conectado" }, { status: 404 });
  }

  try {
    const token = decryptToken(connection.access_token);
    const ads = await getAdsFromAccount(token, accountId);

    return Response.json({
      account_id: accountId,
      ads,
      total: ads.length,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Error al obtener anuncios" },
      { status: 500 }
    );
  }
}
