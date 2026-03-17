import { createClient } from "@/lib/supabase/server";
import { createPortalSession, getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
  const customerId = customers.data[0]?.id;

  if (!customerId) {
    return Response.json({ error: "No se encontro cliente de Stripe" }, { status: 404 });
  }

  const session = await createPortalSession(customerId);
  return Response.json({ url: session.url });
}
