#!/usr/bin/env node
// Generates an original hero background video through our own real Veo
// pipeline (not scraped/captured from anywhere) to replace the placeholder
// in the homepage hero video slot.
import { callVideoModel } from "../src/lib/ai-gateway.ts";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT_DIR = "public/generated";
mkdirSync(OUT_DIR, { recursive: true });

const prompt =
  "A person standing silhouetted against a dramatic sunset sky, cinematic slow motion, wind blowing through hair, warm golden and purple tones, gentle camera drift, atmospheric and inspiring mood";

process.stdout.write("Generating hero-video.mp4 via google/veo-3.1-fast-generate-001... ");
const result = await callVideoModel("google/veo-3.1-fast-generate-001", prompt, { aspectRatio: "16:9", durationSeconds: 4 });
if (!result.ok) {
  console.log("FAILED:", result.error);
  process.exit(1);
}
const ext = result.mediaType.split("/")[1] ?? "mp4";
writeFileSync(`${OUT_DIR}/hero-video.${ext}`, Buffer.from(result.base64, "base64"));
console.log(`done -> ${OUT_DIR}/hero-video.${ext}`);
