import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;

      let plan = "free";
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = "pro";
      if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) plan = "agency";

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await supabase.from("usage_tracking").upsert({
        user_id: userId,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
        plan,
      }, { onConflict: "user_id,period_start" });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

      await supabase.from("usage_tracking").upsert({
        user_id: userId,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
        plan: "free",
      }, { onConflict: "user_id,period_start" });
      break;
    }
  }

  return Response.json({ received: true });
}
