import { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth-helper";
import { createCheckoutSession } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const { planId } = await request.json();
  const plan = PLANS[planId];

  if (!plan || !plan.stripePriceId) {
    return Response.json({ error: "Plan invalido" }, { status: 400 });
  }

  const session = await createCheckoutSession(
    plan.stripePriceId,
    getUserId(),
    ""
  );

  return Response.json({ url: session.url });
}
