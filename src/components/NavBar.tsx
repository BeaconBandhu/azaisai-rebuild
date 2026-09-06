import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { ensureProfile, getBalance } from "@/lib/credits";
import { currentUser } from "@clerk/nextjs/server";

export default async function NavBar() {
  const { userId } = await auth();
  let balance: number | null = null;

  if (userId) {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    await ensureProfile(userId, email);
    balance = await getBalance(userId);
  }

  const navLinks = userId
    ? [
        { href: "/generate/video", label: "Video Generation" },
        { href: "/generate/image", label: "Image Generation" },
        { href: "/history", label: "History" },
        { href: "/faq", label: "FAQ" },
      ]
    : [
        { href: "/generate/video", label: "Video Generation" },
        { href: "/generate/image", label: "Image Generation" },
        { href: "/faq", label: "FAQ" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded bg-accent text-xs text-white">A</span>
          AzaisAi
        </Link>

        <div className="hidden items-center gap-6 text-sm text-muted md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/upgrade"
            className="hidden items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/20 sm:flex"
          >
            Pricing
          </Link>
          {userId ? (
            <>
              <span className="hidden items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground sm:flex">
                ⚡ {balance ?? 0} cr
              </span>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-muted transition hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:bg-accent-hover"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
