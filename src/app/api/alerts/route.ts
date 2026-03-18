import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET() {
  const supabase = getSupabase();

  try {
    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Alerts error:", error);
      // Return empty array instead of 500 - alerts are non-critical
      return NextResponse.json({ alerts: [] });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (err) {
    console.error("Alerts catch:", err);
    return NextResponse.json({ alerts: [] });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
