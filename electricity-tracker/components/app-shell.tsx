"use client";

import { useAuthUser } from "@/lib/firebase/auth";
import { AuthGuard, Nav } from "@/components/auth-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuthUser();
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col">
        <Nav email={user?.email ?? null} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      </div>
    </AuthGuard>
  );
}