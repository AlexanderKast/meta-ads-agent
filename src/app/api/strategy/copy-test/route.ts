import { NextResponse } from "next/server";
import { getSupabase, getUserId } from "@/lib/auth-helper";
import { aiCall, type ToolSchema } from "@/lib/ai-provider";
import { buildCopyTestPrompt } from "@/lib/prompts/strategy";

const copyTestTool: ToolSchema = {
  name: "copy_test_analyzer",
  description:
    "Analiza patrones en copies ganadores y perdedores, y genera nuevas variaciones optimizadas.",
  properties: {
    patterns: {
      type: "object",
      description: "Patrones identificados",
      properties: {
        winners: {
          type: "array",
          description: "Patrones de los copies ganadores",
          items: { type: "string" },
        },
        losers: {
          type: "array",
          description: "Patrones de los copies perdedores",
          items: { type: "string" },
        },
      },
      required: ["winners", "losers"],
    },
    newVariations: {
      type: "array",
      description: "5 nuevas variaciones generadas",
      items: {
        type: "object",
        properties: {
          headline: { type: "string", description: "Titulo del anuncio" },
          primaryText: { type: "string", description: "Texto principal" },
          cta: { type: "string", description: "Call to action" },
          hook: { type: "string", description: "Hook inicial" },
          reasoning: {
            type: "string",
            description: "Razonamiento de por que funcionaria",
          },
        },
        required: ["headline", "primaryText", "cta", "hook", "reasoning"],
      },
    },
  },
  required: ["patterns", "newVariations"],
};

export async function POST() {
  try {
    const supabase = getSupabase();

    // Fetch metrics with generation data
    const { data: metrics, error: metErr } = await supabase
      .from("campaign_metrics")
      .select("*")
      .order("ctr", { ascending: false });

    if (metErr) throw new Error(metErr.message);

    const { data: generations, error: genErr } = await supabase
      .from("generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (genErr) throw new Error(genErr.message);

    // Build copy data by combining metrics with generations
    interface CopyEntry {
      headline: string;
      primaryText: string;
      cta: string;
      platform: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }

    const copies: CopyEntry[] = [];

    // From metrics that have creative info
    for (const met of metrics || []) {
      if (met.headline || met.primary_text) {
        copies.push({
          headline: met.headline || "",
          primaryText: met.primary_text || "",
          cta: met.cta || "",
          platform: met.platform || "meta",
          impressions: met.impressions || 0,
          clicks: met.clicks || 0,
          conversions: met.conversions || 0,
          ctr:
            met.impressions > 0
              ? (met.clicks || 0) / met.impressions
              : 0,
        });
      }
    }

    // Also include generations as potential copies (with simulated metrics if none)
    for (const gen of generations || []) {
      const result =
        typeof gen.result === "string" ? JSON.parse(gen.result) : gen.result;
      if (result?.variations) {
        for (const v of result.variations) {
          copies.push({
            headline: v.headline || "",
            primaryText: v.primaryText || v.primary_text || "",
            cta: v.cta || "",
            platform: gen.platform || "meta",
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
          });
        }
      }
    }

    if (copies.length === 0) {
      return NextResponse.json({
        patterns: {
          winners: ["No hay suficientes datos para analizar patrones ganadores"],
          losers: ["No hay suficientes datos para analizar patrones perdedores"],
        },
        newVariations: [],
      });
    }

    // Sort by CTR to get top and bottom
    const sorted = [...copies].sort((a, b) => b.ctr - a.ctr);
    const topCopies = sorted.slice(0, Math.min(5, Math.ceil(sorted.length / 2)));
    const worstCopies = sorted.slice(-Math.min(5, Math.ceil(sorted.length / 2)));

    const prompt = buildCopyTestPrompt(topCopies, worstCopies);
    const result = await aiCall(prompt, copyTestTool, {
      maxTokens: 8192,
      temperature: 0.8,
      thinking: 1024,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Copy test error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error en analisis de copies" },
      { status: 500 }
    );
  }
}
