import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export const maxDuration = 60;

interface SelectedAccount {
  id: string;            // act_XXXXX
  account_id: string;    // numeric
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business_manager?: {
    id: string;
    name: string;
  } | null;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();

  const { accounts } = (await request.json()) as { accounts: SelectedAccount[] };

  if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
    return Response.json({ error: "No accounts selected" }, { status: 400 });
  }

  // Get the primary Meta token
  const { data: primary } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!primary) {
    return Response.json({ error: "Meta no conectado" }, { status: 404 });
  }

  // First, deactivate any previously saved Meta ad accounts that are NOT in the new selection
  // (but keep the primary token entry)
  const selectedIds = accounts.map(a => a.id);
  await supabase
    .from("connected_accounts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("platform", "meta")
    .eq("is_active", true)
    .not("platform_account_id", "in", `(${[primary.platform_account_id, ...selectedIds].join(",")})`);

  // Save selected accounts
  let saved = 0;
  const errors: string[] = [];

  for (const acct of accounts) {
    const { error } = await supabase.from("connected_accounts").upsert({
      user_id: userId,
      platform: "meta",
      platform_account_id: acct.id,
      account_name: acct.name,
      access_token: primary.access_token,
      refresh_token: primary.refresh_token,
      token_expires_at: primary.token_expires_at,
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

    if (error) {
      errors.push(`${acct.id}: ${error.message}`);
    } else {
      saved++;
    }
  }

  return Response.json({
    success: true,
    saved,
    total: accounts.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
