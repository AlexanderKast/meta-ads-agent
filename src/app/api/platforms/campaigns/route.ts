import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { decryptToken } from "@/lib/platforms/token-manager";
import { getCampaignsWithInsights } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  // If no accountId, return campaign_mappings from DB (fast fallback)
  if (!accountId) {
    const { data, error } = await supabase
      .from("campaign_mappings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // With accountId, fetch live data from Meta API
  const { data: account, error: accErr } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("id", accountId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (accErr || !account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  try {
    const token = decryptToken(account.access_token);

    // Get campaigns with insights for last 90 days
    const now = new Date();
    const start = new Date(now.getTime() - 90 * 86400000).toISOString().split("T")[0];
    const end = now.toISOString().split("T")[0];

    const campaigns = await getCampaignsWithInsights(token, account.platform_account_id, { start, end });

    // Map to campaign_mappings-like format for the frontend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = campaigns.map((c: any) => ({
      id: c.id,
      platform: "meta",
      platform_campaign_id: c.id,
      campaign_name: c.name,
      status: c.status === "active" ? "active" : c.status === "paused" ? "paused" : "archived",
      objective: c.objective,
      budget_amount: c.budget,
      budget_currency: account.metadata?.currency || "USD",
      connected_account_id: accountId,
      created_at: now.toISOString(),
      last_synced_at: now.toISOString(),
      // Real metrics from Meta API
      spend: c.spend,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      revenue: c.revenue,
      ctr: c.ctr,
      cpc: c.cpc,
      roas: c.spend > 0 ? c.revenue / c.spend : 0,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Error fetching campaigns from Meta:", err);
    // Fallback to DB data
    const { data } = await supabase
      .from("campaign_mappings")
      .select("*")
      .eq("user_id", userId)
      .eq("connected_account_id", accountId)
      .order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  }
}
