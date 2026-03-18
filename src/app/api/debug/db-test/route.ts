import { NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Check env vars (without revealing values)
  results.envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    keyUsed: process.env.SUPABASE_SERVICE_ROLE_KEY ? "service_role" : "anon",
  };

  // Test 2: Try to read connected_accounts
  try {
    const supabase = getSupabase();
    const { data, error, count } = await supabase
      .from("connected_accounts")
      .select("id, platform, platform_account_id, account_name, is_active", { count: "exact" })
      .limit(3);
    results.readTest = { success: !error, count, data: data?.length, error: error?.message };
  } catch (err) {
    results.readTest = { success: false, error: String(err) };
  }

  // Test 3: Try to insert a test row
  try {
    const supabase = getSupabase();
    const userId = getUserId();
    const { data, error } = await supabase
      .from("connected_accounts")
      .upsert({
        user_id: userId,
        platform: "meta",
        platform_account_id: "act_debug_test_123",
        account_name: "Debug Test from API",
        access_token: "debug_token",
        is_active: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,platform,platform_account_id" })
      .select("id")
      .single();
    results.writeTest = { success: !error, id: data?.id, error: error?.message, code: error?.code, details: error?.details };
  } catch (err) {
    results.writeTest = { success: false, error: String(err) };
  }

  // Test 4: Clean up test row
  try {
    const supabase = getSupabase();
    await supabase.from("connected_accounts").delete().eq("platform_account_id", "act_debug_test_123");
    results.cleanup = "done";
  } catch {
    results.cleanup = "failed";
  }

  return NextResponse.json(results);
}
