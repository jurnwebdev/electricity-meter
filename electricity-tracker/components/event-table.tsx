"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatNaira, formatSignedUnits, formatUnits, formatDateTime } from "@/lib/format";
import { EventTypeBadge } from "@/components/event-type-badge";
import { totalConsumed, totalRechargeCost } from "@/lib/calculations";
import { sortEventsNewestFirst } from "@/lib/events";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

type Props = {
  events: Event[];
  showActions?: boolean;
  onDelete?: (id: string) => void;
};

export function EventTable({ events, showActions = true, onDelete }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        No events match the current filters.
      </div>
    );
  }

  const sorted = sortEventsNewestFirst(events);
  const totalCost = totalRechargeCost(sorted);
  const totalCons = totalConsumed(sorted);

  return (
    <div>
      {/* Mobile: card list */}
      <ul className="space-y-2 sm:hidden">
        {sorted.map((e) => (
          <MobileEventCard
            key={e.id}
            event={e}
            showActions={showActions}
            onDelete={onDelete}
          />
        ))}
        <li className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span>Totals</span>
          <span className="font-mono tabular-nums">
            {formatNaira(totalCost)} · {formatUnits(totalCons)} kWh used
          </span>
        </li>
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-border/60 bg-card shadow-card sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-44">When</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">App remaining</TableHead>
              <TableHead className="text-right">Credit meter</TableHead>
              <TableHead className="text-right">Usage meter</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Note</TableHead>
              {showActions ? <TableHead className="w-24 text-right">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((e) => (
              <EventRow
                key={e.id}
                event={e}
                showActions={showActions}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
          <tfoot>
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableCell colSpan={5} className="font-medium">
                Totals
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {formatNaira(totalCost)}
              </TableCell>
              <TableCell className="font-mono tabular-nums text-muted-foreground">
                {formatUnits(totalCons)} kWh used
              </TableCell>
              {showActions ? <TableCell /> : null}
            </TableRow>
          </tfoot>
        </Table>
      </div>
    </div>
  );
}

function EventRow({
  event,
  showActions,
  onDelete,
}: {
  event: Event;
  showActions: boolean;
  onDelete?: (id: string) => void;
}) {
  const isEditable = event.type === "recharge" || event.type === "physical_meter";
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {formatDateTime(event.date, event.createdAt)}
      </TableCell>
      <TableCell>
        <EventTypeBadge type={event.type} />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {renderAppRemaining(event)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {renderCredit(event)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {renderUsage(event)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {event.type === "recharge" ? formatNaira(event.costNgn) : "—"}
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-muted-foreground">
        {event.type === "box_reading"
          ? `${formatSignedUnits(event.otherPersonShare)} kWh other`
          : "note" in event && event.note
            ? event.note
            : "—"}
      </TableCell>
      {showActions ? (
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            {isEditable ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/settings/edit/${event.id ?? ""}`}>Edit</Link>
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this event?")) {
                    onDelete(event.id ?? "");
                  }
                }}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  );
}

function MobileEventCard({
  event,
  showActions,
  onDelete,
}: {
  event: Event;
  showActions: boolean;
  onDelete?: (id: string) => void;
}) {
  const isEditable = event.type === "recharge" || event.type === "physical_meter";
  return (
    <li className="rounded-xl border border-border/60 bg-card p-3 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <EventTypeBadge type={event.type} />
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatDateTime(event.date, event.createdAt)}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
            {renderAppRemaining(event) !== "—" ? (
              <span>
                <span className="text-muted-foreground">App</span>{" "}
                <span className="font-mono tabular-nums">
                  {renderAppRemaining(event)}
                </span>
              </span>
            ) : null}
            {renderCredit(event) !== "—" ? (
              <span>
                <span className="text-muted-foreground">Credit</span>{" "}
                <span className="font-mono tabular-nums">
                  {renderCredit(event)}
                </span>
              </span>
            ) : null}
            {renderUsage(event) !== "—" ? (
              <span>
                <span className="text-muted-foreground">Usage</span>{" "}
                <span className="font-mono tabular-nums">
                  {renderUsage(event)}
                </span>
              </span>
            ) : null}
            {event.type === "recharge" ? (
              <span>
                <span className="text-muted-foreground">Cost</span>{" "}
                <span className="font-mono tabular-nums">
                  {formatNaira(event.costNgn)}
                </span>
              </span>
            ) : null}
          </div>
          {event.type === "box_reading" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatSignedUnits(event.otherPersonShare)} kWh other
            </p>
          ) : "note" in event && event.note ? (
            <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>
          ) : null}
        </div>
        {showActions ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isEditable ? (
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Link href={`/settings/edit/${event.id ?? ""}`}>Edit</Link>
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => {
                  if (confirm("Delete this event?")) {
                    onDelete(event.id ?? "");
                  }
                }}
              >
                Delete
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function renderAppRemaining(e: Event): string {
  if (
    e.type === "onboarding" ||
    e.type === "checkin" ||
    e.type === "baseline_adjusted" ||
    e.type === "recharge"
  ) {
    const value =
      e.type === "recharge" ? e.newAppUnitsRemaining : e.appUnitsRemaining;
    return `${formatUnits(value)} kWh`;
  }
  if (e.type === "box_reading") {
    return `${formatUnits(e.appUnitsRemainingAtLog)} kWh`;
  }
  return "—";
}

function renderCredit(e: Event): string {
  if (e.type === "onboarding" || e.type === "baseline_adjusted") {
    return formatUnits(e.creditMeterReading);
  }
  if (e.type === "checkin") {
    return formatUnits(e.derivedCreditReading);
  }
  if (e.type === "physical_meter") {
    return formatUnits(e.creditMeterReading);
  }
  return "—";
}

function renderUsage(e: Event): string {
  if (e.type === "onboarding" || e.type === "baseline_adjusted") {
    return formatUnits(e.usageMeterReading);
  }
  if (e.type === "checkin") {
    return formatUnits(e.derivedUsageReading);
  }
  return "—";
}