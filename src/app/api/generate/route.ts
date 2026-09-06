import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { trySpendCredits, refundCredits } from "@/lib/credits";
import { runPreflightGuardrails } from "@/lib/guardrails";
import { VIDEO_MODELS, IMAGE_MODELS, videoCost, imageCost } from "@/lib/models-catalog";
import { callImageModel, callVideoModel } from "@/lib/ai-gateway";
import { uploadBase64Media } from "@/lib/storage";
import { capture } from "@/lib/posthog";

export const maxDuration = 280;

const bodySchema = z.object({
  type: z.enum(["video", "image"]),
  modelId: z.string(),
  prompt: z.string().min(1).max(2000),
  aspectRatio: z.string(),
  durationSeconds: z.number().optional(),
  style: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { type, modelId, prompt, aspectRatio, durationSeconds, style } = parsed.data;

  const model = type === "video" ? VIDEO_MODELS.find((m) => m.id === modelId) : IMAGE_MODELS.find((m) => m.id === modelId);
  if (!model) return NextResponse.json({ error: "Unknown model" }, { status: 400 });

  const cost = type === "video" ? videoCost(modelId, durationSeconds ?? 4) : imageCost(modelId);
  if (cost <= 0) return NextResponse.json({ error: "Invalid cost" }, { status: 400 });

  // 1. Create the row up front so every outcome (including blocked/rate
  // limited/failed) is a real, visible row in history -- not a silently
  // dropped request.
  const [row] = await sql<{ id: string }[]>`
    insert into generations (clerk_user_id, type, model_id, prompt, params, cost_credits, status, is_preview_mode)
    values (${userId}, ${type}, ${modelId}, ${prompt}, ${JSON.stringify({ aspectRatio, durationSeconds, style })}, ${cost}, 'queued', ${!model.live})
    returning id
  `;
  const generationId = row.id;

  // 2. Guardrails preflight.
  const gate = await runPreflightGuardrails(userId, prompt);
  if (!gate.allowed) {
    await sql`update generations set status = 'blocked', guardrail_verdict = ${gate.trust}, guardrail_reason = ${gate.reason}, completed_at = now() where id = ${generationId}`;
    capture(userId, "generation_blocked", { generationId, type, modelId, reason: gate.trust });
    return NextResponse.json({ id: generationId, status: "blocked", reason: gate.reason }, { status: 200 });
  }

  // 3. Spend credits atomically.
  const newBalance = await trySpendCredits(userId, cost, generationId);
  if (newBalance === null) {
    await sql`update generations set status = 'failed', guardrail_verdict = 'passed', guardrail_reason = 'insufficient_credits', completed_at = now() where id = ${generationId}`;
    return NextResponse.json({ id: generationId, status: "failed", reason: "Not enough credits." }, { status: 200 });
  }

  await sql`update generations set status = 'processing' where id = ${generationId}`;

  // 4. Generate — real model if reachable, otherwise an honest preview mode.
  let outputUrl: string | null = null;
  let failed = false;
  let failReason = "";

  if (model.live && model.gatewayModelId) {
    if (type === "image") {
      const result = await callImageModel(model.gatewayModelId, prompt, aspectRatio);
      if (result.ok) {
        outputUrl = await uploadBase64Media(result.base64, result.mediaType, `images/${userId}`);
      } else {
        failed = true;
        failReason = result.error;
      }
    } else {
      const result = await callVideoModel(model.gatewayModelId, prompt, { aspectRatio, durationSeconds });
      if (result.ok) {
        outputUrl = await uploadBase64Media(result.base64, result.mediaType, `videos/${userId}`);
      } else {
        failed = true;
        failReason = result.error;
      }
    }
  }
  // else: preview mode, no model call -- outputUrl stays null and the UI
  // renders a labeled placeholder card from is_preview_mode + prompt/model.

  if (failed) {
    await refundCredits(userId, cost, generationId);
    await sql`update generations set status = 'failed', guardrail_verdict = 'passed', guardrail_reason = ${failReason}, completed_at = now() where id = ${generationId}`;
    capture(userId, "generation_failed", { generationId, type, modelId, reason: failReason });
    return NextResponse.json({ id: generationId, status: "failed", reason: "The model provider failed; credits were refunded." }, { status: 200 });
  }

  await sql`update generations set status = 'completed', output_url = ${outputUrl}, guardrail_verdict = 'passed', completed_at = now() where id = ${generationId}`;
  capture(userId, "generation_completed", { generationId, type, modelId, preview: !model.live });

  return NextResponse.json({ id: generationId, status: "completed", outputUrl, isPreviewMode: !model.live });
}
