"use client";

import { useAuthUser } from "@/lib/firebase/auth";
import { AuthGuard, Nav } from "@/components/auth-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthUser();
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col">
        <Nav email={user?.email ?? null} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
          {children}
        </main>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent sm:hidden" aria-hidden />
      </div>
    </AuthGuard>
  );
}