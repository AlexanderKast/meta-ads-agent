import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAllAdAccounts, getBusinessManagers } from "@/lib/platforms/meta";

export const maxDuration = 60;

export async function GET() {
  const supabase = getSupabase();
  const userId = getUserId();

  const { data: account } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!account) {
    return Response.json({ error: "Meta no conectado" }, { status: 404 });
  }

  try {
    const token = decryptToken(account.access_token);
    const [adAccounts, bms] = await Promise.all([
      getAllAdAccounts(token),
      getBusinessManagers(token),
    ]);

    // Save all discovered accounts to DB (batch upsert)
    let saved = 0;
    for (const acct of adAccounts) {
      const { error } = await supabase.from("connected_accounts").upsert({
        user_id: userId,
        platform: "meta",
        platform_account_id: acct.id,
        account_name: acct.name,
        access_token: account.access_token, // Same token as primary
        refresh_token: account.refresh_token,
        token_expires_at: account.token_expires_at,
        is_active: true,
        metadata: {
          account_id: acct.account_id,
          currency: acct.currency,
          timezone: acct.timezone_name,
          account_status: acct.account_status,
          business_manager: acct.business_manager || null,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform,platform_account_id" });
      if (!error) saved++;
    }

    return Response.json({
      business_managers: bms,
      ad_accounts: adAccounts,
      total: adAccounts.length,
      saved,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Error al obtener cuentas" },
      { status: 500 }
    );
  }
}
