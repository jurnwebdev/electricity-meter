"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/auth";
import { EditEntryForm } from "@/components/edit-entry-form";
import type { Entry } from "@/lib/types";

export default function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthUser();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { id } = await params;
      if (!user) {
        return;
      }
      try {
        const snap = await getDoc(doc(getFirebaseDb(), "users", user.uid, "entries", id));
        if (cancelled) {
          return;
        }
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = snap.data();
        setEntry({
          id: snap.id,
          type: data.type,
          units: data.units,
          costNgn: data.costNgn,
          ratePerKwh: data.ratePerKwh,
          note: data.note ?? null,
          entryDate: data.entryDate,
          createdAt: data.createdAt?.toMillis() ?? Date.now(),
        });
      } catch (err) {
        console.error(err);
        setNotFound(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params, user]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (notFound || !entry || !user) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Entry not found.</p>
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          ← Back to settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit entry</h1>
        <p className="text-sm text-muted-foreground">
          Update the details for this entry.
        </p>
      </div>
      <EditEntryForm uid={user.uid} entry={entry} />
    </div>
  );
}
