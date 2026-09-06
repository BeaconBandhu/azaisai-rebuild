"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(formData: FormData) {
    setStatus("sending");
    const body = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      subject: String(formData.get("subject") || ""),
      message: String(formData.get("message") || ""),
    };
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setStatus("sent");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Contact us</h1>
      <p className="mt-2 text-sm text-muted">We'll respond within 24–48 hours. Check the FAQ for immediate answers.</p>

      {status === "sent" ? (
        <p className="mt-8 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
          Message sent — thanks for reaching out.
        </p>
      ) : (
        <form action={handleSubmit} className="mt-8 space-y-4">
          <input name="name" required placeholder="Name" className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none ring-accent focus:ring-2" />
          <input name="email" type="email" required placeholder="Email" className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none ring-accent focus:ring-2" />
          <select name="subject" required className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none ring-accent focus:ring-2">
            <option value="">Choose a subject</option>
            <option>Billing</option>
            <option>Bug report</option>
            <option>Feature request</option>
            <option>Other</option>
          </select>
          <textarea name="message" required rows={5} maxLength={2000} placeholder="Message" className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none ring-accent focus:ring-2" />
          <button type="submit" disabled={status === "sending"} className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
