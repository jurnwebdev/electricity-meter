"use client";

import { useAuthUser } from "@/lib/firebase/auth";
import { AuthGuard, Nav } from "@/components/auth-shell";
import { MobileNav } from "@/components/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthUser();
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col">
        <Nav email={user?.email ?? null} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-16 sm:pt-10">
          {children}
        </main>
        <SiteFooter />
        <MobileNav />
      </div>
    </AuthGuard>
  );
}

function SiteFooter() {
  return (
    <footer className="hidden border-t border-border/60 bg-background/60 py-5 sm:block">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1 px-6 text-xs text-muted-foreground sm:flex-row">
        <p>
          Developed by{" "}
          <a
            href="https://tjweb.dev"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            tjweb
          </a>
        </p>
        <p className="text-muted-foreground/80">
          Track electricity, calmly.
        </p>
      </div>
    </footer>
  );
}