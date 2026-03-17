import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getUserId } from "@/lib/auth-helper";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const userId = getUserId();
  let campaignsDiscovered = 0;
  let metricsSynced = 0;

  try {
    // Fetch all active connected accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("is_active", true);

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json({ synced: 0, message: accountsError?.message || "No active accounts" });
    }

    // Date range: last 7 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    const dateRange = {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };

    for (const account of accounts) {
      try {
        if (!isSupportedPlatform(account.platform)) continue;

        const client = getPlatformClient(account.platform);
        const token = decryptToken(account.access_token);
        const tokens = { accessToken: token };

        // Fetch campaigns from platform
        const campaigns = await client.listCampaigns(tokens, account.platform_account_id);

        for (const campaign of campaigns) {
          try {
            // Upsert campaign_mapping (auto-discover)
            const { data: existingMapping } = await supabase
              .from("campaign_mappings")
              .select("id")
              .eq("connected_account_id", account.id)
              .eq("platform_campaign_id", campaign.id)
              .single();

            let mappingId: string;

            if (existingMapping) {
              mappingId = existingMapping.id;
              await supabase.from("campaign_mappings").update({
                campaign_name: campaign.name,
                status: campaign.status || "unknown",
                objective: campaign.objective || null,
                budget_amount: campaign.budget || null,
                last_synced_at: new Date().toISOString(),
              }).eq("id", mappingId);
            } else {
              const { data: newMapping, error: mapErr } = await supabase
                .from("campaign_mappings")
                .insert({
                  user_id: account.user_id || userId,
                  connected_account_id: account.id,
                  platform: account.platform,
                  platform_campaign_id: campaign.id,
                  campaign_name: campaign.name,
                  status: campaign.status || "unknown",
                  objective: campaign.objective || null,
                  budget_amount: campaign.budget || null,
                  last_synced_at: new Date().toISOString(),
                })
                .select("id")
                .single();

              if (mapErr || !newMapping) continue;
              mappingId = newMapping.id;
              campaignsDiscovered++;
            }

            // Fetch and store metrics
            const metrics = await client.getMetrics(tokens, campaign.id, account.platform_account_id, dateRange);

            for (const metric of metrics) {
              const spend = Number(metric.spend) || 0;
              const clicks = Number(metric.clicks) || 0;
              const impressions = Number(metric.impressions) || 0;

              const { error: upsertError } = await supabase
                .from("campaign_metrics")
                .upsert({
                  campaign_mapping_id: mappingId,
                  date: metric.date,
                  impressions,
                  clicks,
                  spend,
                  conversions: Number(metric.conversions) || 0,
                  revenue: Number(metric.revenue) || 0,
                  ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                  cpc: clicks > 0 ? spend / clicks : 0,
                  cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                  roas: spend > 0 ? Number(metric.revenue) / spend : 0,
                }, { onConflict: "campaign_mapping_id,date" });

              if (!upsertError) metricsSynced++;
            }
          } catch (campaignErr) {
            console.error(`Error syncing campaign ${campaign.id}:`, campaignErr);
          }
        }
      } catch (accountErr) {
        console.error(`Error syncing account ${account.id}:`, accountErr);
      }
    }
  } catch (err) {
    console.error("Sync metrics error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ campaignsDiscovered, metricsSynced });
}
