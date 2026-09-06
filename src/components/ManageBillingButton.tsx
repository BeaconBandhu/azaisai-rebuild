"use client";

import { useState } from "react";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "No subscription yet — subscribe first from the Pricing page.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-border px-4 py-2 text-sm hover:bg-surface-2 disabled:opacity-60"
    >
      {loading ? "Opening..." : "Manage billing"}
    </button>
  );
}
