import { z } from "zod";

export const verdictSchema = z.object({
  verdict: z.enum(["pass", "flag", "block"]),
  reason: z.string().describe("One sentence explaining the decision."),
  category: z
    .enum(["none", "sexual_minors", "graphic_violence", "hate", "self_harm", "illegal_activity", "other_policy"])
    .describe("Policy category if flagged/blocked, otherwise 'none'."),
});

export type Verdict = z.infer<typeof verdictSchema>;

export const MODERATION_SYSTEM_PROMPT = `You are a content-safety classifier for an AI image/video generation product.
Classify the user's generation prompt below. Be permissive of ordinary creative, artistic, and commercial content
(including stylized violence in fiction, mild innuendo, brand/celebrity names for parody). Block only prompts that
clearly request: sexual content involving minors, graphic real-world violence intended to shock/harm, hateful content
targeting protected groups, instructions for self-harm, or clearly illegal activity. Use "flag" for genuinely
ambiguous cases that deserve a second opinion rather than an outright block. Respond with the verdict, a one-sentence
reason, and the policy category.`;
