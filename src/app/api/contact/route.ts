import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { name, email, subject, message } = parsed.data;

  await sql`
    insert into contact_messages (name, email, subject, message)
    values (${name}, ${email}, ${subject}, ${message})
  `;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "AzaisAi <onboarding@resend.dev>",
          to: "support@azaisai.example",
          reply_to: email,
          subject: `[Contact] ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
        }),
      });
    } catch {
      // Non-fatal: the message is already stored in contact_messages.
    }
  }

  return NextResponse.json({ ok: true });
}
