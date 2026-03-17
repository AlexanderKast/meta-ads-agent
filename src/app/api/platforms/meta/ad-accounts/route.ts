import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getAllAdAccounts, getBusinessManagers } from "@/lib/platforms/meta";

export async function GET() {
  const supabase = getSupabase();
  const userId = getUserId();

  // Get the Meta connection (any active one for the token)
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

    // Group accounts by BM
    const grouped = {
      business_managers: bms,
      ad_accounts: adAccounts,
      total: adAccounts.length,
    };

    return Response.json(grouped);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Error al obtener cuentas" },
      { status: 500 }
    );
  }
}
