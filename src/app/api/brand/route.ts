import { NextRequest } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", getUserId())
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  const body = await request.json();

  const { data, error } = await supabase.from("brand_profiles").insert({
    user_id: getUserId(),
    brand_name: body.brand_name,
    description: body.description,
    tone_keywords: body.tone_keywords || [],
    target_audience: body.target_audience,
    do_say: body.do_say || [],
    dont_say: body.dont_say || [],
    colors: body.colors || {},
    logo_url: body.logo_url,
  }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabase();

  const body = await request.json();

  const { data, error } = await supabase
    .from("brand_profiles")
    .update({
      brand_name: body.brand_name,
      description: body.description,
      tone_keywords: body.tone_keywords,
      target_audience: body.target_audience,
      do_say: body.do_say,
      dont_say: body.dont_say,
      colors: body.colors,
      logo_url: body.logo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .eq("user_id", getUserId())
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
