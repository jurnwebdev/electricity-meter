"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthUser } from "@/lib/firebase/auth";
import { useEntries, deleteEntry } from "@/lib/firebase/entries";
import { useRate } from "@/lib/firebase/settings";
import { RateForm } from "@/components/rate-form";
import { EntriesTable } from "@/components/entries-table";
import { compareDateKeys } from "@/lib/date";

export default function SettingsPage() {
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { entries } = useEntries(uid);
  const { rate } = useRate(uid);

  const sorted = [...entries].sort((a, b) => {
    const byDate = compareDateKeys(b.entryDate, a.entryDate);
    if (byDate !== 0) {
      return byDate;
    }
    return b.createdAt - a.createdAt;
  });

  async function handleDelete(id: string) {
    if (!uid) {
      return;
    }
    try {
      await deleteEntry(uid, id);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Set your default recharge rate and manage your entries.
        </p>
      </div>

      <RateForm uid={uid!} rate={rate} />

      <Card>
        <CardHeader>
          <CardTitle>All entries</CardTitle>
        </CardHeader>
        <CardContent>
          <EntriesTable entries={sorted} onDelete={handleDelete} />
        </CardContent>
      </Card>
    </div>
  );
}
