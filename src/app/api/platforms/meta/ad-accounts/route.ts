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

    // Return discovery data without auto-saving
    // Saving is now done explicitly via /api/platforms/meta/save-selected
    return Response.json({
      business_managers: bms,
      ad_accounts: adAccounts,
      total: adAccounts.length,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Error al obtener cuentas" },
      { status: 500 }
    );
  }
}
