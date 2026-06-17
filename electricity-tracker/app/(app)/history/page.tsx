"use client";

import { Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthUser } from "@/lib/firebase/auth";
import { useEntries } from "@/lib/firebase/entries";
import { HistoryFilters } from "@/components/history-filters";
import { EntriesTable } from "@/components/entries-table";
import { filterEntries } from "@/lib/calculations";
import { downloadCsv } from "@/lib/csv";
import { useSearchParams } from "next/navigation";
import { compareDateKeys } from "@/lib/date";

function HistoryBody() {
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { entries } = useEntries(uid);
  const params = useSearchParams();

  const type = (params.get("type") as "recharge" | "usage" | "all" | null) ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const filtered = useMemo(
    () => filterEntries(entries, { type, from, to }),
    [entries, type, from, to]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const byDate = compareDateKeys(b.entryDate, a.entryDate);
        if (byDate !== 0) {
          return byDate;
        }
        return b.createdAt - a.createdAt;
      }),
    [filtered]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">
            All entries. Filter by type and date range.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadCsv(sorted)}
          disabled={sorted.length === 0}
        >
          Export CSV
        </Button>
      </div>

      <HistoryFilters />

      <Card>
        <CardContent className="pt-6">
          <EntriesTable entries={sorted} showEdit={false} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <HistoryBody />
    </Suspense>
  );
}
