import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe, siteUrl } from "@/lib/stripe";
import { sql } from "@/lib/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await sql<{ stripe_customer_id: string | null }[]>`
    select stripe_customer_id from profiles where clerk_user_id = ${userId}
  `;
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription yet" }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/account`,
  });

  return NextResponse.json({ url: session.url });
}
