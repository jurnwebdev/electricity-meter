"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuthUser, signOut } from "@/lib/firebase/auth";
import { getFirebaseDb } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  requireMeterSetup?: boolean;
};

export function AuthGuard({ children, requireMeterSetup = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthUser();
  const [setup, setSetup] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (!user) {
      setSetup(null);
      return;
    }
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "users", user.uid),
      (snap) => {
        const data = snap.data();
        setSetup(Boolean(data && data.meterSetup));
      },
      () => {
        setSetup(false);
      }
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !requireMeterSetup || setup === null) {
      return;
    }
    if (!setup && pathname !== "/onboarding") {
      router.replace("/onboarding");
    } else if (setup && pathname === "/onboarding") {
      router.replace("/");
    }
  }, [user, requireMeterSetup, setup, pathname, router]);

  if (loading || setup === null) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireMeterSetup && !setup && pathname !== "/onboarding") {
    return null;
  }

  return <>{children}</>;
}

type NavProps = {
  email: string | null;
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Nav({ email }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105"
          >
            <BoltIcon className="size-3.5" />
          </span>
          <span className="hidden sm:inline">Electricity</span>
          <span className="text-muted-foreground/60 hidden sm:inline">Tracker</span>
        </Link>
        <nav className="ml-2 hidden items-center gap-0.5 sm:flex">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {email ? (
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {email}
            </span>
          ) : null}
          <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:inline-flex">
            Sign out
          </Button>
          <MobileMenu pathname={pathname} email={email} onSignOut={handleSignOut} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({
  pathname,
  email,
  onSignOut,
}: {
  pathname: string;
  email: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <MenuIcon className="size-4" />
      </button>
      {open ? (
        <div className="absolute inset-x-0 top-14 z-30 border-b border-border bg-background/95 px-4 py-3 shadow-elevated backdrop-blur">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            {email ? (
              <div className="mt-1 truncate px-3 text-xs text-muted-foreground">
                {email}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="mt-1 rounded-md px-3 py-2.5 text-left text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              Sign out
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}