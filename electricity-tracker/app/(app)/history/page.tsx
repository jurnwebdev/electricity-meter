"use client";

import { Suspense, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/lib/firebase/auth";
import { useEvents } from "@/lib/firebase/events";
import { HistoryFilters } from "@/components/history-filters";
import { EventTable } from "@/components/event-table";
import { filterEvents, sortEventsNewestFirst } from "@/lib/events";
import { downloadCsv } from "@/lib/csv";
import { useSearchParams } from "next/navigation";
import { formatInteger } from "@/lib/format";
import type { EventType } from "@/lib/types";

function HistoryBody() {
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { events } = useEvents(uid);
  const params = useSearchParams();

  const type = (params.get("type") as EventType | "all" | null) ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const filtered = useMemo(
    () => sortEventsNewestFirst(filterEvents(events, { type, from, to })),
    [events, type, from, to]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length === events.length
              ? `${formatInteger(filtered.length)} event${filtered.length === 1 ? "" : "s"}`
              : `${formatInteger(filtered.length)} of ${formatInteger(events.length)} events`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadCsv(filtered)}
          disabled={filtered.length === 0}
        >
          Export CSV
        </Button>
      </div>

      <HistoryFilters />

      <EventTable events={filtered} showActions={false} />
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-muted-foreground">Loading…</div>
      }
    >
      <HistoryBody />
    </Suspense>
  );
}