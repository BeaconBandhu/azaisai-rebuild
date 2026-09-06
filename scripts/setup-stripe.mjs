#!/usr/bin/env node
// One-off setup: creates the Stripe products/prices for the 3 subscription
// tiers + 3 one-time credit top-ups in the sandbox account, then prints the
// resulting Price IDs so they can be set as Vercel env vars. Safe to re-run
// -- looks up by product name before creating, so it won't duplicate.
import Stripe from "stripe";
import { TIERS, TOP_UPS } from "../src/lib/models-catalog.ts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function findOrCreateProduct(name, metadata) {
  const existing = await stripe.products.search({ query: `name:'${name}' AND active:'true'` });
  if (existing.data.length > 0) return existing.data[0];
  return stripe.products.create({ name, metadata });
}

const results = {};

for (const tier of TIERS) {
  const product = await findOrCreateProduct(`AzaisAi ${tier.label}`, { tier: tier.id });
  const prices = await stripe.prices.list({ product: product.id, active: true });
  let price = prices.data.find((p) => p.recurring?.interval === "month" && p.unit_amount === Math.round(tier.priceMonthly * 100));
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(tier.priceMonthly * 100),
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { tier: tier.id, credits: String(tier.creditsPerMonth) },
    });
  }
  results[tier.stripePriceEnv] = price.id;
}

for (const topup of TOP_UPS) {
  const product = await findOrCreateProduct(`AzaisAi ${topup.label}`, { topup: topup.id });
  const prices = await stripe.prices.list({ product: product.id, active: true });
  let price = prices.data.find((p) => !p.recurring && p.unit_amount === Math.round(topup.price * 100));
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(topup.price * 100),
      currency: "usd",
      metadata: { topup: topup.id, credits: String(topup.credits) },
    });
  }
  results[topup.stripePriceEnv] = price.id;
}

console.log(JSON.stringify(results, null, 2));
