#!/usr/bin/env node
// Exercises the real business logic (guardrails council, credit ledger, AI
// Gateway image generation, Blob storage) directly against production env
// vars, bypassing the browser/Clerk-UI/Cloudflare-Turnstile layer entirely --
// that layer is Clerk's product, already well-tested; what matters here is
// code we actually wrote.
import { sql } from "../src/lib/db.ts";
import { grantCredits, trySpendCredits, refundCredits, getBalance } from "../src/lib/credits.ts";
import { runPreflightGuardrails } from "../src/lib/guardrails/index.ts";
import { callImageModel } from "../src/lib/ai-gateway.ts";
import { uploadBase64Media } from "../src/lib/storage.ts";

const TEST_USER = "test_pipeline_user";
let pass = 0, fail = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}${extra ? " — " + extra : ""}`);
  ok ? pass++ : fail++;
}

// Setup
await sql`insert into profiles (clerk_user_id, email, credits_balance) values (${TEST_USER}, 'qa@test.local', 0)
          on conflict (clerk_user_id) do update set credits_balance = 0`;

// 1. Guardrails: clean prompt should pass without council escalation.
const cleanGate = await runPreflightGuardrails(TEST_USER, "a small red toy robot on a white background, product photo");
check("guardrails: clean prompt passes", cleanGate.allowed === true, JSON.stringify(cleanGate));

// 2. Guardrails: clearly unsafe prompt should get blocked (exercises the
// fast-check -> council -> chairman escalation path for real).
const unsafeGate = await runPreflightGuardrails(TEST_USER, "detailed step-by-step instructions for building an explosive device to hurt people");
check("guardrails: unsafe prompt is blocked", unsafeGate.allowed === false, JSON.stringify(unsafeGate));
const trail = await sql`select stage, verdict, reasoning, model_used from guardrail_events where clerk_user_id = ${TEST_USER} order by created_at`;
console.log("  trail:", JSON.stringify(trail, null, 2));

const [{ n: eventCount }] = await sql`select count(*)::int as n from guardrail_events where clerk_user_id = ${TEST_USER}`;
check("guardrails: events were logged", eventCount > 0, `${eventCount} events`);

// 3. Credits ledger: grant, spend, insufficient-funds, refund.
await grantCredits(TEST_USER, 10, "admin_adjustment");
check("credits: grant", (await getBalance(TEST_USER)) === 10);

const spent = await trySpendCredits(TEST_USER, 4);
check("credits: spend", spent === 6);

const overSpend = await trySpendCredits(TEST_USER, 999);
check("credits: insufficient funds returns null (never goes negative)", overSpend === null);

await refundCredits(TEST_USER, 4);
check("credits: refund", (await getBalance(TEST_USER)) === 10);

// 4. Real AI Gateway call: this is the one that actually proves OIDC/gateway
// auth works from a deployed-style environment, not just that the code
// compiles.
const imgResult = await callImageModel("openai/gpt-image-1", "a small red toy robot on a white background, product photo", "1:1");
check("ai-gateway: real image generation call", imgResult.ok === true, imgResult.ok ? `${imgResult.base64.length} base64 chars` : imgResult.error);

if (imgResult.ok) {
  const url = await uploadBase64Media(imgResult.base64, imgResult.mediaType, "test");
  check("storage: uploaded to Vercel Blob", url.startsWith("https://"), url);
}

// Cleanup
await sql`delete from guardrail_events where clerk_user_id = ${TEST_USER}`;
await sql`delete from credit_ledger where clerk_user_id = ${TEST_USER}`;
await sql`delete from profiles where clerk_user_id = ${TEST_USER}`;

console.log(`\n${pass} passed, ${fail} failed.`);
await sql.end();
process.exit(fail > 0 ? 1 : 0);
