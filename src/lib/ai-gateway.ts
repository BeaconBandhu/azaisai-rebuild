import { generateImage, experimental_generateVideo as generateVideo } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const directOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
const hasDirectOpenAI = Boolean(process.env.OPENAI_API_KEY);

export interface RealImageResult {
  ok: true;
  base64: string;
  mediaType: string;
}
export interface RealVideoResult {
  ok: true;
  base64: string;
  mediaType: string;
}
export interface FailedResult {
  ok: false;
  error: string;
}

function aspectRatioToOpenAISize(aspectRatio?: string): `${number}x${number}` {
  switch (aspectRatio) {
    case "16:9":
    case "4:3":
      return "1536x1024";
    case "9:16":
    case "3:4":
      return "1024x1536";
    default:
      return "1024x1024";
  }
}

/** Calls the real image model. Prefers direct OpenAI (BYOK) for
 * openai/gpt-image-* models -- found by testing that this Vercel account's
 * free AI Gateway tier rate-limits under real load, and the direct path has
 * its own dedicated quota. Falls back to the gateway otherwise (and for any
 * non-OpenAI model). Never throws -- returns a tagged failure instead, so
 * callers can fall back to preview mode instead of crashing the request. */
export async function callImageModel(
  gatewayModelId: string,
  prompt: string,
  aspectRatio?: string
): Promise<RealImageResult | FailedResult> {
  const useDirect = hasDirectOpenAI && gatewayModelId.startsWith("openai/");
  const model = useDirect ? directOpenAI.image(gatewayModelId.replace(/^openai\//, "")) : gatewayModelId;
  try {
    const result = await generateImage(
      useDirect
        // gpt-image-1 takes `size` ("WxH"), not `aspectRatio` -- it warns
        // and ignores aspectRatio otherwise (found by testing).
        ? { model, prompt, size: aspectRatioToOpenAISize(aspectRatio) }
        : { model, prompt, aspectRatio: aspectRatio as `${number}:${number}` | undefined }
    );
    const img = result.image;
    return { ok: true, base64: img.base64, mediaType: img.mediaType ?? "image/png" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Calls the real video model via Vercel AI Gateway. Blocking (the SDK polls
 * internally until done) -- acceptable here because our only "live" video
 * models (Veo 3 / Veo 3 Fast) finish in well under our route's maxDuration.
 * No direct-provider fallback exists for video (no Google API key), so a
 * gateway rate-limit here surfaces as an honest "failed, credits refunded"
 * rather than a fake result. */
export async function callVideoModel(
  gatewayModelId: string,
  prompt: string,
  opts: { aspectRatio?: string; durationSeconds?: number }
): Promise<RealVideoResult | FailedResult> {
  try {
    const result = await generateVideo({
      model: gatewayModelId,
      prompt,
      aspectRatio: opts.aspectRatio as `${number}:${number}` | undefined,
      duration: opts.durationSeconds,
      poll: { intervalMs: 4000, timeoutMs: 240000 },
    });
    const vid = result.video;
    return { ok: true, base64: vid.base64, mediaType: vid.mediaType ?? "video/mp4" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
