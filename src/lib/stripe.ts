import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

// Re-export for backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function createCheckoutSession(priceId: string, userId: string, email: string) {
  const s = getStripe();
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
    customer_email: email,
    metadata: { userId },
  });
  return session;
}

export async function createPortalSession(customerId: string) {
  const s = getStripe();
  const session = await s.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/billing`,
  });
  return session;
}
