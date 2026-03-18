import { NextRequest, NextResponse } from "next/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { encryptToken } from "@/lib/platforms/token-manager";

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

    const client = getPlatformClient(platform);
    const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
    const tokens = await client.exchangeCode(code, redirectUri);

    let encryptedAccess = tokens.accessToken;
    let encryptedRefresh: string | null = tokens.refreshToken || null;

    if (process.env.PLATFORM_ENCRYPTION_KEY) {
      encryptedAccess = encryptToken(tokens.accessToken);
      encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    }

    // Pass token data to a save endpoint instead of saving here
    // This avoids the redirect-kills-async issue in Vercel
    const saveData = Buffer.from(JSON.stringify({
      userId,
      platform,
      accountId: tokens.accountId || "default",
      accountName: tokens.accountName || `${platform} account`,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresAt: tokens.expiresAt?.toISOString(),
    })).toString("base64url");

    return NextResponse.redirect(`${baseUrl}/app/integrations?save=${saveData}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${baseUrl}/app/integrations?error=${encodeURIComponent(msg.slice(0, 100))}`);
  }
}
