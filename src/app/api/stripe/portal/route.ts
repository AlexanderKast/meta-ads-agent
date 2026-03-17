import { getUserId } from "@/lib/auth-helper";
import { createPortalSession, getStripe } from "@/lib/stripe";

export async function POST() {
  const stripe = getStripe();
  // Search by metadata filter isn't supported in list; use search instead
  const customers = await stripe.customers.search({
    query: `metadata["userId"]:"${getUserId()}"`,
    limit: 1,
  });
  const customerId = customers.data[0]?.id;

  if (!customerId) {
    return Response.json({ error: "No se encontro cliente de Stripe" }, { status: 404 });
  }

  const session = await createPortalSession(customerId);
  return Response.json({ url: session.url });
}
