-- Initial schema for the AzaisAi rebuild.
--
-- Identity is owned by Clerk (auth), not Supabase Auth — this database is a
-- private backing store queried only from trusted server code (Next.js
-- Route Handlers / Server Actions) using the Supabase service-role key. RLS
-- is intentionally left off: there is no client-side Supabase access at all,
-- so there is nothing for a policy to protect that server-side code paths
-- don't already gate on the Clerk session.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  clerk_user_id       text primary key,
  email               text not null,
  credits_balance     integer not null default 0,
  stripe_customer_id  text,
  subscription_tier   text,        -- 'starter' | 'pro' | 'business' | null
  subscription_status text,        -- mirrors Stripe subscription status
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists credit_ledger (
  id                   uuid primary key default gen_random_uuid(),
  clerk_user_id        text not null references profiles(clerk_user_id),
  delta                integer not null,   -- positive = grant/refund, negative = spend
  reason               text not null,      -- signup_bonus | subscription_grant | topup_purchase | generation_spend | generation_refund | admin_adjustment
  related_generation_id uuid,
  created_at           timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on credit_ledger(clerk_user_id, created_at desc);

create table if not exists subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  clerk_user_id          text not null references profiles(clerk_user_id),
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  tier                   text not null,  -- starter | pro | business
  status                 text not null,  -- active | past_due | canceled | ...
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on subscriptions(clerk_user_id);

create table if not exists generations (
  id                 uuid primary key default gen_random_uuid(),
  clerk_user_id      text not null references profiles(clerk_user_id),
  type               text not null,   -- video | image
  model_id           text not null,
  prompt             text not null,
  params             jsonb not null default '{}'::jsonb,
  cost_credits       integer not null,
  status             text not null default 'queued', -- queued | processing | completed | failed | blocked
  output_url         text,
  thumbnail_url      text,
  guardrail_verdict  text,            -- passed | flagged | blocked | fallback_used
  guardrail_reason   text,
  is_preview_mode    boolean not null default false,
  created_at         timestamptz not null default now(),
  completed_at       timestamptz
);
create index if not exists generations_user_idx on generations(clerk_user_id, created_at desc);

create table if not exists guardrail_events (
  id             uuid primary key default gen_random_uuid(),
  generation_id  uuid references generations(id),
  clerk_user_id  text,
  stage          text not null,  -- fast_check | council_judge_a | council_judge_b | chairman
  verdict        text not null,  -- passed | flagged | blocked
  reasoning      text,
  model_used     text,
  latency_ms     integer,
  created_at     timestamptz not null default now()
);
create index if not exists guardrail_events_generation_idx on guardrail_events(generation_id);

create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);
