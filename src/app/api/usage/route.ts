import { getSupabase, getUserId } from "@/lib/auth-helper";
import { getPlan } from "@/lib/plans";

export async function GET() {
  const supabase = getSupabase();

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const { data } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", getUserId())
    .eq("period_start", periodStart)
    .single();

  const plan = data?.plan || "free";
  const planConfig = getPlan(plan);

  return Response.json({
    plan,
    generationsUsed: data?.generations_used || 0,
    generationsLimit: planConfig.generations,
    periodStart: data?.period_start || periodStart,
    periodEnd: data?.period_end,
  });
}
