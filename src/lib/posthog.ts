import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null; // PostHog not provisioned yet -- capture() becomes a harmless no-op.
  if (!client) {
    client = new PostHog(key, { host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com" });
  }
  return client;
}

export function capture(distinctId: string, event: string, properties?: Record<string, unknown>) {
  getClient()?.capture({ distinctId, event, properties });
}
