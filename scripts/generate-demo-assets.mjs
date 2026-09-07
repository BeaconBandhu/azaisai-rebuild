#!/usr/bin/env node
// Generates a small set of ORIGINAL demo images through our own real
// generation pipeline (not scraped from anywhere) to populate the homepage
// gallery and the generate-studio "example" panels. Saves as static files
// under public/generated/ since this is our own bundled demo content, not
// runtime user output (which goes to Blob).
import { callImageModel } from "../src/lib/ai-gateway.ts";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT_DIR = "public/generated";
mkdirSync(OUT_DIR, { recursive: true });

const prompts = [
  { file: "gallery-1.png", prompt: "a small toy robot astronaut floating among colorful balloons, studio product photography, soft lighting", aspectRatio: "1:1" },
  { file: "gallery-2.png", prompt: "a majestic mountain range at golden hour with dramatic clouds and a calm lake reflection, cinematic landscape photography", aspectRatio: "16:9" },
  { file: "gallery-3.png", prompt: "a neon-lit futuristic city street at night with glowing signs and light trails, cyberpunk illustration", aspectRatio: "16:9" },
  { file: "gallery-4.png", prompt: "a cozy wooden workshop with warm sunlight through a window, hand tools on a bench, rustic still life", aspectRatio: "4:3" },
  { file: "studio-example-video.png", prompt: "a golden retriever wearing a tiny astronaut helmet floating in space near a space station, whimsical cinematic still", aspectRatio: "16:9" },
  { file: "studio-example-image.png", prompt: "an elderly craftsman looking out a workshop window at golden hour, cinematic portrait photography", aspectRatio: "1:1" },
];

for (const p of prompts) {
  process.stdout.write(`Generating ${p.file}... `);
  const result = await callImageModel("openai/gpt-image-1", p.prompt, p.aspectRatio);
  if (!result.ok) {
    console.log("FAILED:", result.error);
    continue;
  }
  writeFileSync(`${OUT_DIR}/${p.file}`, Buffer.from(result.base64, "base64"));
  console.log("done");
}
