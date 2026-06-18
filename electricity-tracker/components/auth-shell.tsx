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
            className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105"
          >
            <BoltIcon className="size-4" />
          </span>
          <span className="hidden sm:inline">Electricity</span>
          <span className="hidden text-muted-foreground/60 sm:inline">
            Tracker
          </span>
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
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="hidden sm:inline-flex"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
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