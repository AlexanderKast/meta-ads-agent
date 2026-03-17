import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
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
  let synced = 0;

  try {
    // Fetch all active connected accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("status", "active");

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ synced: 0, message: "No active accounts" });
    }

    // Date range: last 3 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 3);
    const dateRange = {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };

    for (const account of accounts) {
      try {
        if (!isSupportedPlatform(account.platform)) continue;

        const client = getPlatformClient(account.platform);
        const tokens = {
          accessToken: decryptToken(account.access_token),
          refreshToken: account.refresh_token ? decryptToken(account.refresh_token) : undefined,
        };

        // Get campaigns for this account
        const campaigns = await client.listCampaigns(tokens, account.account_id);

        for (const campaign of campaigns) {
          try {
            const metrics = await client.getMetrics(tokens, campaign.id, account.account_id, dateRange);

            for (const metric of metrics) {
              // Upsert metrics into campaign_metrics
              const { error: upsertError } = await supabase
                .from("campaign_metrics")
                .upsert(
                  {
                    campaign_id: campaign.id,
                    platform: account.platform,
                    account_id: account.account_id,
                    date: metric.date,
                    impressions: metric.impressions,
                    clicks: metric.clicks,
                    spend: metric.spend,
                    conversions: metric.conversions,
                    revenue: metric.revenue,
                    cpc: metric.clicks > 0 ? metric.spend / metric.clicks : 0,
                    ctr: metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0,
                    roas: metric.spend > 0 ? metric.revenue / metric.spend : 0,
                    updated_at: new Date().toISOString(),
                  },
                  { onConflict: "campaign_id,date" }
                );

              if (upsertError) {
                console.error(`Error upserting metrics for ${campaign.id}:`, upsertError);
              } else {
                synced++;
              }
            }

            // Update last_synced_at on campaign_mappings
            await supabase
              .from("campaign_mappings")
              .update({ last_synced_at: new Date().toISOString() })
              .eq("platform_campaign_id", campaign.id);
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

  return NextResponse.json({ synced });
}
