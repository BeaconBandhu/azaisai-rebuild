"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function CheckoutButton({
  kind,
  id,
  label,
  primary,
}: {
  kind: "subscription" | "topup";
  id: string;
  label: string;
  primary?: boolean;
}) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!isSignedIn) {
      router.push(`/sign-up?returnUrl=/upgrade`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-full rounded-md py-2.5 text-sm font-medium transition disabled:opacity-60 ${
        primary ? "bg-accent text-white hover:bg-accent-hover" : "border border-border hover:bg-surface-2"
      }`}
    >
      {loading ? "Redirecting..." : label}
    </button>
  );
}
