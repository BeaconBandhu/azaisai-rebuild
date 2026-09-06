import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-2">
            <div className="flex items-center gap-2 font-semibold">
              <span className="grid h-6 w-6 place-items-center rounded bg-accent text-xs text-white">A</span>
              AzaisAi
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted">
              Generate cinematic videos and stunning images using the world&apos;s best AI models. All in one platform, on one subscription.
            </p>
            <p className="mt-3 text-xs text-muted">
              Powered by Sora · Veo · Runway · GPT Image
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/generate/video" className="hover:text-foreground">Video Generation</Link></li>
              <li><Link href="/generate/image" className="hover:text-foreground">Image Generation</Link></li>
              <li><Link href="/upgrade" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="/history" className="hover:text-foreground">History</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/80 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 AzaisAi. All rights reserved. (Rebuild — not affiliated with the original.)</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
