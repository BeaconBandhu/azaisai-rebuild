import { generateImage, experimental_generateVideo as generateVideo } from "ai";

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

/** Calls the real image model via Vercel AI Gateway. Never throws — returns
 * a tagged failure instead, so callers can fall back to preview mode instead
 * of crashing the request. */
export async function callImageModel(
  gatewayModelId: string,
  prompt: string,
  aspectRatio?: string
): Promise<RealImageResult | FailedResult> {
  try {
    const result = await generateImage({
      model: gatewayModelId,
      prompt,
      aspectRatio: aspectRatio as `${number}:${number}` | undefined,
    });
    const img = result.image;
    return { ok: true, base64: img.base64, mediaType: img.mediaType ?? "image/png" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Calls the real video model via Vercel AI Gateway. Blocking (the SDK polls
 * internally until done) -- acceptable here because our only "live" video
 * models (Veo 3 / Veo 3 Fast) finish in well under our route's maxDuration. */
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
