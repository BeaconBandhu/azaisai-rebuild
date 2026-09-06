import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { sql } from "@/lib/db";
import { grantCredits } from "@/lib/credits";
import { TIERS, TOP_UPS } from "@/lib/models-catalog";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = secret ? stripe.webhooks.constructEvent(raw, sig!, secret) : (JSON.parse(raw) as Stripe.Event);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const clerkUserId = session.metadata?.clerk_user_id;
      const kind = session.metadata?.kind;
      const itemId = session.metadata?.item_id;
      if (!clerkUserId) break;

      if (kind === "topup") {
        const topup = TOP_UPS.find((t) => t.id === itemId);
        if (topup) await grantCredits(clerkUserId, topup.credits, "topup_purchase");
      }
      // Subscriptions: the initial grant happens on invoice.paid below, so
      // every renewal (not just signup) goes through the same code path.
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = (invoice as unknown as { subscription?: string }).subscription;
      if (!subId) break;
      const subscription = await stripe.subscriptions.retrieve(subId);
      const clerkUserId = subscription.metadata?.clerk_user_id;
      const priceId = subscription.items.data[0]?.price.id;
      const tier = TIERS.find((t) => process.env[t.stripePriceEnv] === priceId);
      if (clerkUserId && tier) {
        await grantCredits(clerkUserId, tier.creditsPerMonth, "subscription_grant");
        await sql`
          update profiles set subscription_tier = ${tier.id}, subscription_status = ${subscription.status}
          where clerk_user_id = ${clerkUserId}
        `;
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const priceId = sub.items.data[0]?.price.id;
      const tier = TIERS.find((t) => process.env[t.stripePriceEnv] === priceId);
      const periodEnd = sub.items.data[0]?.current_period_end;
      const [profile] = await sql<{ clerk_user_id: string }[]>`
        select clerk_user_id from profiles where stripe_customer_id = ${customerId}
      `;
      if (profile) {
        await sql`
          insert into subscriptions (clerk_user_id, stripe_subscription_id, stripe_customer_id, tier, status, current_period_end)
          values (${profile.clerk_user_id}, ${sub.id}, ${customerId}, ${tier?.id ?? "unknown"}, ${sub.status}, ${periodEnd ? new Date(periodEnd * 1000).toISOString() : null})
          on conflict (stripe_subscription_id) do update set status = excluded.status, current_period_end = excluded.current_period_end
        `;
        await sql`update profiles set subscription_tier = ${tier?.id ?? null}, subscription_status = ${sub.status} where clerk_user_id = ${profile.clerk_user_id}`;
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await sql`update subscriptions set status = 'canceled' where stripe_subscription_id = ${sub.id}`;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      await sql`update profiles set subscription_status = 'canceled' where stripe_customer_id = ${customerId}`;
      break;
    }
  }

  return NextResponse.json({ received: true });
}
