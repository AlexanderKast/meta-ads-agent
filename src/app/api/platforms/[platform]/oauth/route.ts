import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;

  if (!isSupportedPlatform(platform)) {
    return Response.json({ error: "Plataforma no soportada" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autenticado" }, { status: 401 });

  const client = getPlatformClient(platform);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64url");

  const authUrl = client.getAuthUrl(redirectUri, state);

  return Response.redirect(authUrl);
}
