import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { decryptToken } from "@/lib/platforms/token-manager";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for large syncs

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const userId = getUserId();

  // Optional: sync specific account or platform
  const body = await request.json().catch(() => ({}));
  const filterAccountId = body.accountId as string | undefined;
  const filterPlatform = body.platform as string | undefined;
  const daysBack = body.days || 30;

  // Fetch all active connected accounts
  let query = supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (filterAccountId) query = query.eq("id", filterAccountId);
  if (filterPlatform) query = query.eq("platform", filterPlatform);

  const { data: accounts, error: accountsError } = await query;

  if (accountsError) {
    return Response.json({ error: accountsError.message }, { status: 500 });
  }

  if (!accounts || accounts.length === 0) {
    return Response.json({ error: "No hay cuentas conectadas" }, { status: 404 });
  }

  const results = {
    accounts_synced: 0,
    campaigns_discovered: 0,
    metrics_synced: 0,
    errors: [] as string[],
  };

  // Date range
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const dateRange = {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };

  for (const account of accounts) {
    if (!isSupportedPlatform(account.platform)) continue;

    try {
      const client = getPlatformClient(account.platform);
      const token = decryptToken(account.access_token);
      const tokens = {
        accessToken: token,
        refreshToken: account.refresh_token ? decryptToken(account.refresh_token) : undefined,
      };

      // 1. Fetch all campaigns from the platform
      const campaigns = await client.listCampaigns(tokens, account.platform_account_id);

      for (const campaign of campaigns) {
        try {
          // 2. Upsert campaign_mapping (auto-discover)
          // First check if mapping exists
          const { data: existingMapping } = await supabase
            .from("campaign_mappings")
            .select("id")
            .eq("connected_account_id", account.id)
            .eq("platform_campaign_id", campaign.id)
            .single();

          let mappingId: string;

          if (existingMapping) {
            mappingId = existingMapping.id;
            // Update existing mapping with fresh data
            await supabase
              .from("campaign_mappings")
              .update({
                campaign_name: campaign.name,
                status: campaign.status || "unknown",
                objective: campaign.objective || null,
                budget_amount: campaign.budget || null,
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", mappingId);
          } else {
            // Create new mapping for discovered campaign
            const { data: newMapping, error: mappingError } = await supabase
              .from("campaign_mappings")
              .insert({
                user_id: userId,
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

            if (mappingError) {
              results.errors.push(`Mapping error for ${campaign.name}: ${mappingError.message}`);
              continue;
            }
            mappingId = newMapping!.id;
            results.campaigns_discovered++;
          }

          // 3. Fetch metrics for this campaign
          try {
            const metrics = await client.getMetrics(tokens, campaign.id, account.platform_account_id, dateRange);

            for (const metric of metrics) {
              const spend = Number(metric.spend) || 0;
              const clicks = Number(metric.clicks) || 0;
              const impressions = Number(metric.impressions) || 0;
              const conversions = Number(metric.conversions) || 0;
              const revenue = Number(metric.revenue) || 0;

              const { error: metricError } = await supabase
                .from("campaign_metrics")
                .upsert({
                  campaign_mapping_id: mappingId,
                  date: metric.date,
                  impressions,
                  clicks,
                  spend,
                  conversions,
                  revenue,
                  ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
                  cpc: clicks > 0 ? spend / clicks : 0,
                  cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
                  roas: spend > 0 ? revenue / spend : 0,
                }, { onConflict: "campaign_mapping_id,date" });

              if (metricError) {
                results.errors.push(`Metric error for ${campaign.name} ${metric.date}: ${metricError.message}`);
              } else {
                results.metrics_synced++;
              }
            }
          } catch (metricsErr) {
            // Some campaigns may not have metrics (e.g., draft campaigns)
            const msg = metricsErr instanceof Error ? metricsErr.message : String(metricsErr);
            if (!msg.includes("no data")) {
              results.errors.push(`Metrics fetch error for ${campaign.name}: ${msg}`);
            }
          }
        } catch (campaignErr) {
          const msg = campaignErr instanceof Error ? campaignErr.message : String(campaignErr);
          results.errors.push(`Campaign error ${campaign.id}: ${msg}`);
        }
      }

      results.accounts_synced++;
    } catch (accountErr) {
      const msg = accountErr instanceof Error ? accountErr.message : String(accountErr);
      results.errors.push(`Account ${account.account_name} error: ${msg}`);
    }
  }

  return Response.json(results);
}

// Also support GET for simple triggering
export async function GET() {
  return Response.json({
    message: "Use POST to sync. Optional body: { accountId?, platform?, days?: 30 }",
  });
}
