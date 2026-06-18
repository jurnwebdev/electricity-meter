"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEvent } from "@/lib/firebase/events";
import { buildBoxReadingEvent } from "@/lib/events";
import { today } from "@/lib/date";
import { reduceEvents, round2 } from "@/lib/calculations";
import { formatSignedUnits, formatUnits } from "@/lib/format";
import type { Event } from "@/lib/types";

type Props = {
  uid: string;
  events: Event[];
};

type LastResult = {
  box: number;
  yours: number;
  signedGap: number;
};

export function LogBoxReading({ uid, events }: Props) {
  const state = reduceEvents(events);
  const lastBoxEvent = events
    .filter((e) => e.type === "box_reading")
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n) || n < 0) {
      setError("Box reading must be zero or greater.");
      return;
    }
    setSubmitting(true);
    try {
      const ev = buildBoxReadingEvent(state, n, today(), Date.now());
      await createEvent(uid, ev);
      setLastResult({
        box: n,
        yours: state.appUnitsRemaining,
        signedGap: round2(n - state.appUnitsRemaining),
      });
      setValue("");
    } catch (err) {
      console.error(err);
      setError("Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Log box reading
        </p>
        {lastBoxEvent && lastBoxEvent.type === "box_reading" ? (
          <span className="text-xs text-muted-foreground">
            Last: {formatUnits(lastBoxEvent.boxUnitsRemaining)} kWh ·{" "}
            {lastBoxEvent.date}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5 sm:max-w-[14rem]">
          <Label htmlFor="box-reading" className="sr-only">
            Box shows in kWh
          </Label>
          <div className="relative">
            <Input
              id="box-reading"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 74.98"
              className="h-11 pr-12 sm:h-10"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              kWh
            </span>
          </div>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="h-11 sm:h-10"
        >
          {submitting ? "Saving…" : "Log reading"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {lastResult ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Logged {formatUnits(lastResult.box)} kWh on the box. Your share:{" "}
          {formatUnits(lastResult.yours)} kWh. Other person's share:{" "}
          {formatSignedUnits(lastResult.signedGap)} kWh.
        </p>
      ) : null}
    </form>
  );
}