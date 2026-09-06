"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const params = useSearchParams();
  const returnUrl = params.get("returnUrl") || "/generate/video";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");

  async function handleSendCode() {
    await signIn.emailCode.sendCode({ emailAddress: email });
    if (!errors?.global) setStage("code");
  }

  async function handleVerify() {
    await signIn.emailCode.verifyCode({ code });
    if (signIn.status === "complete") {
      await signIn.finalize({
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

        <h1 className="mt-6 text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          {stage === "email" ? "Enter your email to receive a sign-in code" : `Enter the code we sent to ${email}`}
        </p>

        {stage === "email" ? (
          <form action={handleSendCode} className="mt-6 space-y-4">
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
              {errors?.fields?.identifier && (
                <p className="mt-1 text-xs text-danger">{errors.fields.identifier.message}</p>
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
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/sign-up" className="text-accent hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
