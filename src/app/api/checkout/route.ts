import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { stripe, siteUrl } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { TIERS, TOP_UPS } from "@/lib/models-catalog";

const bodySchema = z.object({
  kind: z.enum(["subscription", "topup"]),
  id: z.string(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { kind, id } = parsed.data;

  const item = kind === "subscription" ? TIERS.find((t) => t.id === id) : TOP_UPS.find((t) => t.id === id);
  if (!item) return NextResponse.json({ error: "Unknown item" }, { status: 400 });

  const priceId = process.env[item.stripePriceEnv];
  if (!priceId) return NextResponse.json({ error: `Missing env var ${item.stripePriceEnv}` }, { status: 500 });

  // Reuse an existing Stripe customer if we've already created one for this user.
  const [profile] = await sql<{ stripe_customer_id: string | null; email: string }[]>`
    select stripe_customer_id, email from profiles where clerk_user_id = ${userId}
  `;
  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? profile?.email;
    const customer = await stripe.customers.create({ email, metadata: { clerk_user_id: userId } });
    customerId = customer.id;
    await sql`update profiles set stripe_customer_id = ${customerId} where clerk_user_id = ${userId}`;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: kind === "subscription" ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl()}/account?checkout=success`,
    cancel_url: `${siteUrl()}/upgrade?checkout=cancelled`,
    metadata: { clerk_user_id: userId, kind, item_id: id },
  });

  return NextResponse.json({ url: session.url });
}
