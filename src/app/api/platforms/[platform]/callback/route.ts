import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { encryptToken } from "@/lib/platforms/token-manager";

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code || !state || !isSupportedPlatform(platform)) {
    return NextResponse.redirect(`${baseUrl}/app/integrations?error=invalid`);
  }

  try {
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    const userId = stateData.userId;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.redirect(`${baseUrl}/app/integrations?error=auth`);
    }

    const client = getPlatformClient(platform);
    const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
    const tokens = await client.exchangeCode(code, redirectUri);

    // Encrypt tokens before storing
    const encryptedAccess = encryptToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

    await supabase.from("connected_accounts").upsert({
      user_id: userId,
      platform,
      platform_account_id: tokens.accountId,
      account_name: tokens.accountName,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at: tokens.expiresAt?.toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,platform,platform_account_id" });

    return NextResponse.redirect(`${baseUrl}/app/integrations?success=${platform}`);
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    return NextResponse.redirect(`${baseUrl}/app/integrations?error=oauth`);
  }
}
