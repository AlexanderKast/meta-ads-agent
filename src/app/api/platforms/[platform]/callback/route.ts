import { NextRequest } from "next/server";
import { getPlatformClient, isSupportedPlatform } from "@/lib/platforms";
import { encryptToken } from "@/lib/platforms/token-manager";
import { getUserId } from "@/lib/auth-helper";

export async function GET(request: NextRequest, { params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  if (!code || !state || !isSupportedPlatform(platform)) {
    return new Response(`<script>window.location.href="${baseUrl}/app/integrations?error=invalid_params"</script>`, {
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const client = getPlatformClient(platform);
    const redirectUri = `${baseUrl}/api/platforms/${platform}/callback`;
    const tokens = await client.exchangeCode(code, redirectUri);

    let encryptedAccess = tokens.accessToken;
    let encryptedRefresh: string | null = tokens.refreshToken || null;

    if (process.env.PLATFORM_ENCRYPTION_KEY) {
      encryptedAccess = encryptToken(tokens.accessToken);
      encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;
    }

    const userId = getUserId();

    // Return HTML that saves the account via fetch, then redirects
    const savePayload = JSON.stringify({
      userId,
      platform,
      accountId: tokens.accountId || "default",
      accountName: tokens.accountName || `${platform} account`,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresAt: tokens.expiresAt?.toISOString(),
    });

    const html = `<!DOCTYPE html>
<html><head><title>Conectando...</title></head>
<body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center">
  <p id="status">Guardando cuenta...</p>
  <script>
    (async function() {
      try {
        const res = await fetch("${baseUrl}/api/platforms/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: ${JSON.stringify(savePayload)},
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById("status").textContent = "Conectado! Redirigiendo...";
          window.location.href = "${baseUrl}/app/integrations?success=${platform}";
        } else {
          document.getElementById("status").textContent = "Error: " + (data.error || "Unknown");
          setTimeout(() => window.location.href = "${baseUrl}/app/integrations?error=" + encodeURIComponent(data.error || "save_failed"), 3000);
        }
      } catch(e) {
        document.getElementById("status").textContent = "Error: " + e.message;
        setTimeout(() => window.location.href = "${baseUrl}/app/integrations?error=save_exception", 3000);
      }
    })();
  </script>
</div>
</body></html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(`<script>window.location.href="${baseUrl}/app/integrations?error=${encodeURIComponent(msg.slice(0, 100))}"</script>`, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
