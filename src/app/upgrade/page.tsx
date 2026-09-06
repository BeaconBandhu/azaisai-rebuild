import { TIERS, TOP_UPS } from "@/lib/models-catalog";
import CheckoutButton from "@/components/CheckoutButton";

export default function UpgradePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">
        Unlock <span className="text-accent">everything</span>
      </h1>
      <p className="mt-2 text-muted">Get unlimited access to all features. Cancel anytime.</p>

      <div className="mt-10 text-left">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Subscription plans</h2>
          <span className="text-xs text-muted">Cancel anytime</span>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl border p-6 ${tier.popular ? "border-accent" : "border-border"} bg-surface`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold">{tier.label}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">{tier.tagline}</span>
              </div>
              <p className="mt-3 text-3xl font-semibold">
                ${tier.priceMonthly.toFixed(2)}
                <span className="text-sm font-normal text-muted">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                {tier.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <div className="mt-6">
                <CheckoutButton kind="subscription" id={tier.id} label="Subscribe" primary={tier.popular} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 text-left">
        <h2 className="text-lg font-semibold">Credit top-ups</h2>
        <p className="mt-1 text-sm text-muted">Buy extra credits whenever you need them.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {TOP_UPS.map((topup) => (
            <div key={topup.id} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{topup.label}</span>
                <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">One-time</span>
              </div>
              <p className="mt-3 text-3xl font-semibold">${topup.price.toFixed(2)}</p>
              <p className="mt-1 text-sm text-muted">{topup.credits} credits</p>
              <div className="mt-6">
                <CheckoutButton kind="topup" id={topup.id} label="Purchase credits" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
