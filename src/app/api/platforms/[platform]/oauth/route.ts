import { NextRequest } from "next/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { getUserId } from "@/lib/auth-helper";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;

  if (!isSupportedPlatform(platform)) {
    return Response.json({ error: "Plataforma no soportada" }, { status: 400 });
  }

  const client = getPlatformClient(platform);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
  const state = Buffer.from(JSON.stringify({ userId: getUserId() })).toString("base64url");

  const authUrl = client.getAuthUrl(redirectUri, state);

  return Response.redirect(authUrl);
}
