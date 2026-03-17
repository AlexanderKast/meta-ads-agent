import { NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    let query = supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (platform) {
      query = query.eq("platform", platform);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Transform generations into creative cards
    interface CreativeCard {
      id: string;
      platform: string;
      headline: string;
      primaryText: string;
      cta: string;
      hook: string;
      status: string;
      createdAt: string;
      generationId: string;
      variationIndex: number;
    }

    const creatives: CreativeCard[] = [];

    for (const gen of data || []) {
      const result =
        typeof gen.result === "string"
          ? (() => {
              try {
                return JSON.parse(gen.result);
              } catch {
                return null;
              }
            })()
          : gen.result;

      if (result?.variations) {
        for (let i = 0; i < result.variations.length; i++) {
          const v = result.variations[i];
          creatives.push({
            id: `${gen.id}-${i}`,
            platform: gen.platform || "meta",
            headline: v.headline || "",
            primaryText: v.primaryText || v.primary_text || "",
            cta: v.cta || "",
            hook: v.hook || "",
            status: gen.status || "draft",
            createdAt: gen.created_at,
            generationId: gen.id,
            variationIndex: i,
          });
        }
      }
    }

    return NextResponse.json({ creatives });
  } catch (err) {
    console.error("Creatives GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al obtener creativos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const { generationId, variationIndex, status } = body;

    if (!generationId) {
      return NextResponse.json(
        { error: "generationId es requerido" },
        { status: 400 }
      );
    }

    // Update the generation status
    const { data, error } = await supabase
      .from("generations")
      .update({ status: status || "published" })
      .eq("id", generationId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      generation: data,
      variationIndex: variationIndex || 0,
    });
  } catch (err) {
    console.error("Creatives POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al guardar creativo" },
      { status: 500 }
    );
  }
}
