import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("campaign_mappings")
    .select("*")
    .eq("user_id", getUserId())
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
