import { NextRequest, NextResponse } from "next/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { encryptToken } from "@/lib/platforms/token-manager";
import { getSupabase } from "@/lib/auth-helper";

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  if (!code || !state || !isSupportedPlatform(platform)) {
    return NextResponse.redirect(`${baseUrl}/app/integrations?error=invalid_params`);
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    const userId = stateData.userId;

    console.log(`[OAuth] Platform: ${platform}, exchanging code...`);

    const client = getPlatformClient(platform);
    const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
    const tokens = await client.exchangeCode(code, redirectUri);

    console.log(`[OAuth] Token received. Account: ${tokens.accountName}, ID: ${tokens.accountId}`);

    let encryptedAccess = tokens.accessToken;
    let encryptedRefresh: string | null = tokens.refreshToken || null;

    // Only encrypt if PLATFORM_ENCRYPTION_KEY is set
    if (process.env.PLATFORM_ENCRYPTION_KEY) {
      encryptedAccess = encryptToken(tokens.accessToken);
      encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    }

    const supabase = getSupabase();

    // Store just the primary account — skip 138-account discovery to avoid timeout
    console.log(`[OAuth] Upserting account. userId=${userId}, platform=${platform}, accountId=${tokens.accountId}`);

    const upsertData = {
      user_id: userId,
      platform,
      platform_account_id: tokens.accountId || "default",
      account_name: tokens.accountName || `${platform} account`,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at: tokens.expiresAt?.toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: upsertResult, error: dbError } = await supabase
      .from("connected_accounts")
      .upsert(upsertData, { onConflict: "user_id,platform,platform_account_id" })
      .select("id")
      .single();

    console.log(`[OAuth] Upsert result:`, { id: upsertResult?.id, error: dbError?.message, code: dbError?.code });

    if (dbError) {
      console.error(`[OAuth] DB error:`, JSON.stringify(dbError));
      return NextResponse.redirect(`${baseUrl}/app/integrations?error=db_${dbError.code}`);
    }

    console.log(`[OAuth] Success! ${platform} connected. ID: ${upsertResult?.id}`);
    return NextResponse.redirect(`${baseUrl}/app/integrations?success=${platform}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[OAuth] Callback error for ${platform}:`, msg);
    return NextResponse.redirect(`${baseUrl}/app/integrations?error=${encodeURIComponent(msg.slice(0, 100))}`);
  }
}
