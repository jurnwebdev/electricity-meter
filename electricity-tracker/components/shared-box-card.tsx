"use client";

import { reduceEvents, round2 } from "@/lib/calculations";
import { formatSignedUnits, formatUnits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

type Props = {
  events: Event[];
};

export function SharedBoxCard({ events }: Props) {
  const state = reduceEvents(events);
  const hasBox = state.lastBoxReading !== null;
  const box = state.lastBoxReading ?? 0;
  const yours = state.appUnitsRemaining;
  const gap = hasBox ? round2(box - yours) : 0;

  // Build a proportional split when both numbers are present and non-zero.
  let minePct: number | null = null;
  let otherPct: number | null = null;
  let otherNeg = false;
  if (hasBox && box > 0) {
    minePct = Math.max(0, Math.min(100, (yours / box) * 100));
    otherPct = 100 - minePct;
    otherNeg = gap < 0;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-0.5">
          <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/70">
            Shared meter box
          </p>
          <p className="text-sm font-medium text-foreground/75">
            {hasBox
              ? "Last time you checked the box. The split shows your share vs the other person's."
              : "Log a box reading to see your share versus the other person sharing the meter."}
          </p>
        </div>
        {hasBox ? (
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/70">
              Box shows
            </div>
            <div className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {formatUnits(box)}{" "}
              <span className="text-sm font-medium text-foreground/65">kWh</span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="relative h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={
          hasBox
            ? `Your share ${minePct?.toFixed(0)} percent, other person's share ${otherPct?.toFixed(0)} percent`
            : "No box reading logged yet"
        }
      >
        {hasBox && minePct !== null ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
            style={{ width: `${minePct}%` }}
          />
        ) : null}
        {hasBox && otherPct !== null && otherPct > 0 ? (
          <div
            className="absolute inset-y-0 right-0 rounded-full bg-amber-400/80 dark:bg-amber-500/70"
            style={{ width: `${otherPct}%` }}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/70 bg-card/60 p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/70">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            Your units
          </div>
          <div className="mt-1 font-mono text-xl font-bold tabular-nums tracking-tight text-foreground">
            {formatUnits(yours)}{" "}
            <span className="text-sm font-medium text-foreground/65">kWh</span>
          </div>
        </div>
        <div
          className={cn(
            "rounded-lg border border-border/70 bg-card/60 p-3",
            !hasBox && "opacity-60"
          )}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/70">
            <span
              className="size-2 rounded-full bg-amber-400 dark:bg-amber-500"
              aria-hidden
            />
            Other person's share
          </div>
          <div
            className={cn(
              "mt-1 font-mono text-xl font-bold tabular-nums tracking-tight",
              hasBox && otherNeg && "text-amber-600 dark:text-amber-400",
              hasBox && !otherNeg && "text-foreground"
            )}
          >
            {hasBox ? (
              <>
                {formatSignedUnits(gap)}{" "}
                <span className="text-sm font-medium text-foreground/65">kWh</span>
              </>
            ) : (
              <span className="text-foreground/50">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}