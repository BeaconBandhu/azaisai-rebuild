// Single source of truth for models, credit costs, and pricing tiers.
// The generate pages, the FAQ, and the pricing page all read from this file
// so copy can't drift out of sync the way the real azaisai.com's FAQ and UI
// currently disagree with each other (see recon/gap-analysis.md, gap #4).

export type Badge = "Popular" | "Premium" | "Fast" | "New" | "4K";

export interface VideoModel {
  id: string;
  label: string;
  provider: "Sora" | "Veo" | "Runway";
  badge?: Badge;
  creditsPerSecond: number;
  approxTime: string;
  /** Real generation is wired through Vercel AI Gateway; anything not
   * reachable there runs the same pipeline in a clearly labeled preview mode. */
  live: boolean;
}

export interface ImageModel {
  id: string;
  label: string;
  provider: "OpenAI" | "Google" | "Runway";
  badge?: Badge;
  credits: number;
  approxTime: string;
  live: boolean;
}

export const VIDEO_MODELS: VideoModel[] = [
  { id: "sora-standard", label: "Sora Standard", provider: "Sora", badge: "Popular", creditsPerSecond: 1.0, approxTime: "~2m", live: false },
  { id: "sora-pro", label: "Sora Pro", provider: "Sora", badge: "Premium", creditsPerSecond: 2.0, approxTime: "~3m", live: false },
  { id: "veo-2", label: "Veo 2", provider: "Veo", creditsPerSecond: 3.0, approxTime: "~45s", live: false },
  { id: "veo-3-fast", label: "Veo 3 Fast", provider: "Veo", badge: "Fast", creditsPerSecond: 1.5, approxTime: "~35s", live: false },
  { id: "veo-3", label: "Veo 3", provider: "Veo", badge: "New", creditsPerSecond: 3.0, approxTime: "~1m", live: false },
  { id: "gen4-turbo", label: "Gen-4 Turbo", provider: "Runway", badge: "Popular", creditsPerSecond: 1.0, approxTime: "~2m", live: false },
  { id: "gen4-5", label: "Gen-4.5", provider: "Runway", badge: "Premium", creditsPerSecond: 1.2, approxTime: "~2m", live: false },
  { id: "gen3-alpha-turbo", label: "Gen-3 Alpha Turbo", provider: "Runway", badge: "Fast", creditsPerSecond: 1.0, approxTime: "~1m", live: false },
];

export const IMAGE_MODELS: ImageModel[] = [
  { id: "gpt-image", label: "GPT Image", provider: "OpenAI", badge: "Premium", credits: 2, approxTime: "~10s", live: true },
  { id: "nano-banana-2", label: "Nano Banana 2", provider: "Google", badge: "New", credits: 1, approxTime: "~8s", live: true },
  { id: "nano-banana-2-4k", label: "Nano Banana 2 4K", provider: "Google", badge: "4K", credits: 2, approxTime: "~15s", live: true },
  { id: "gen4-image", label: "Gen-4 Image", provider: "Runway", badge: "New", credits: 1, approxTime: "~20s", live: false },
];

export const ASPECT_RATIOS_VIDEO = ["16:9", "9:16"] as const;
export const DURATIONS = [4, 8, 12] as const;
export const ASPECT_RATIOS_IMAGE = ["16:9", "1:1", "9:16", "4:3", "3:4"] as const;
export const IMAGE_STYLES = ["None", "Cinematic", "Anime", "Photo", "Illustration"] as const;

export function videoCost(modelId: string, durationSeconds: number): number {
  const model = VIDEO_MODELS.find((m) => m.id === modelId);
  if (!model) return 0;
  return Math.ceil(model.creditsPerSecond * durationSeconds);
}

export function imageCost(modelId: string): number {
  return IMAGE_MODELS.find((m) => m.id === modelId)?.credits ?? 0;
}

export interface Tier {
  id: "starter" | "pro" | "business";
  label: string;
  tagline: string;
  priceMonthly: number;
  creditsPerMonth: number;
  features: string[];
  popular?: boolean;
  stripePriceEnv: string; // name of the env var holding the Stripe Price ID
}

export const TIERS: Tier[] = [
  {
    id: "starter",
    label: "Starter",
    tagline: "Core",
    priceMonthly: 16.9,
    creditsPerMonth: 60,
    features: ["60 credits / month", "Priority video + image queue", "Standard support"],
    stripePriceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    id: "pro",
    label: "Pro",
    tagline: "Popular",
    priceMonthly: 32.9,
    creditsPerMonth: 180,
    features: ["180 credits / month", "Priority rendering", "Dedicated support"],
    popular: true,
    stripePriceEnv: "STRIPE_PRICE_PRO",
  },
  {
    id: "business",
    label: "Business",
    tagline: "Power",
    priceMonthly: 65.9,
    creditsPerMonth: 420,
    features: ["420 credits / month", "Priority video + image queue", "Commercial license"],
    stripePriceEnv: "STRIPE_PRICE_BUSINESS",
  },
];

export interface TopUp {
  id: "starter-pack" | "value-pack" | "pro-pack";
  label: string;
  price: number;
  credits: number;
  stripePriceEnv: string;
}

export const TOP_UPS: TopUp[] = [
  { id: "starter-pack", label: "Starter Pack", price: 37.9, credits: 100, stripePriceEnv: "STRIPE_PRICE_TOPUP_100" },
  { id: "value-pack", label: "Value Pack", price: 53.9, credits: 200, stripePriceEnv: "STRIPE_PRICE_TOPUP_200" },
  { id: "pro-pack", label: "Pro Pack", price: 62.9, credits: 300, stripePriceEnv: "STRIPE_PRICE_TOPUP_300" },
];

/** Free credits granted immediately on verified email signup — no phone-OTP
 * gate. See recon/gap-analysis.md gap #1/#2 for why this differs from the
 * live product. */
export const SIGNUP_BONUS_CREDITS = 8;
