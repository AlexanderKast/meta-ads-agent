import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { planId } = await request.json();
  const plan = PLANS[planId];

  if (!plan || !plan.stripePriceId) {
    return Response.json({ error: "Plan invalido" }, { status: 400 });
  }

  const session = await createCheckoutSession(
    plan.stripePriceId,
    user.id,
    user.email || ""
  );

  return Response.json({ url: session.url });
}
