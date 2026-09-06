"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";

// Passwordless signup: email + one-time code only, matching the real
// product's UX. Clerk's instance has "password" marked required at the API
// level (an instance-config toggle we couldn't flip programmatically — see
// CAPTURE-TEST.md-adjacent build notes), so we generate a random password
// the user never sees or needs, and rely entirely on the email code for
// every sign-in from then on. See .agents/skills/clerk-custom-ui.
function randomPassword() {
  return `${crypto.randomUUID()}Aa1!`;
}

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const params = useSearchParams();
  const returnUrl = params.get("returnUrl") || "/generate/video";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSendCode() {
    setNotice(null);
    const { error } = await signUp.create({ emailAddress: email, password: randomPassword() });
    if (error) return;
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) return;
    setStage("code");
  }

  async function handleVerify() {
    setNotice(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: async ({ decorateUrl }) => {
          const url = decorateUrl(returnUrl);
          if (url.startsWith("http")) window.location.href = url;
          else router.push(url);
        },
      });
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-border bg-surface p-8">
        <div className="flex items-center gap-2 font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded bg-accent text-xs text-white">A</span>
          AzaisAi
        </div>
        <div className="mt-6 h-px w-10 bg-accent" />

        <h1 className="mt-6 text-2xl font-semibold">Create account</h1>
        <p className="mt-1 text-sm text-muted">
          {stage === "email" ? "Enter your email to receive a sign-in code" : `Enter the code we sent to ${email}`}
        </p>

        {stage === "email" ? (
          <form
            action={handleSendCode}
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                placeholder="you@example.com"
              />
              {/* Required by Clerk's bot sign-up protection, enabled by
                  default -- without this element the CAPTCHA widget fails
                  to initialize and signUp.create() hangs silently. */}
              <div id="clerk-captcha" />
              {errors?.fields?.emailAddress && (
                <p className="mt-1 text-xs text-danger">{errors.fields.emailAddress.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {fetchStatus === "fetching" ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form action={handleVerify} className="mt-6 space-y-4">
            <div>
              <label htmlFor="code" className="text-sm font-medium">Code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm tracking-widest outline-none ring-accent focus:ring-2"
                placeholder="123456"
              />
              {errors?.fields?.code && <p className="mt-1 text-xs text-danger">{errors.fields.code.message}</p>}
            </div>
            <button
              type="submit"
              disabled={fetchStatus === "fetching"}
              className="w-full rounded-md bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {fetchStatus === "fetching" ? "Verifying..." : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => signUp.verifications.sendEmailCode()}
              className="w-full text-center text-xs text-muted hover:text-foreground"
            >
              Resend code
            </button>
          </form>
        )}

        {notice && <p className="mt-3 text-xs text-danger">{notice}</p>}

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-6">
        <p className="text-sm font-medium text-accent">Free AI Credits</p>
        <p className="mt-1 text-sm text-muted">
          Claim <strong className="text-foreground">8 free credits</strong> the moment your email is verified —
          no phone number, no credit card.
        </p>
      </div>
    </div>
  );
}
