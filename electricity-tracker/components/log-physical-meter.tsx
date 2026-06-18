"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEvent } from "@/lib/firebase/events";
import { buildPhysicalMeterEvent } from "@/lib/events";
import { today } from "@/lib/date";
import { driftKwh, reduceEvents } from "@/lib/calculations";
import { formatSignedUnits, formatUnits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Event, MeterSetup } from "@/lib/types";

type Props = {
  uid: string;
  meterSetup: MeterSetup;
  events: Event[];
};

export function LogPhysicalMeter({ uid, meterSetup, events }: Props) {
  const state = reduceEvents(events);
  const [reading, setReading] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDrift, setLastDrift] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = Number.parseFloat(reading);
    if (!Number.isFinite(n) || n < 0) {
      setError("Reading must be zero or greater.");
      return;
    }
    setSubmitting(true);
    try {
      const ev = buildPhysicalMeterEvent(
        state,
        n,
        note.trim() === "" ? null : note.trim(),
        today(),
        Date.now()
      );
      await createEvent(uid, ev);
      setLastDrift(ev.driftKwh);
      setReading("");
      setNote("");
    } catch (err) {
      console.error(err);
      setError("Could not save.");
    } finally {
      setSubmitting(false);
    }
  }

  const overThreshold =
    lastDrift !== null && Math.abs(lastDrift) > meterSetup.driftThreshold;

  return (
    <Card size="sm" className="shadow-card">
      <CardHeader>
        <CardTitle>Physical credit meter</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter what the physical credit meter reads. The app compares it to
            the derived value ({formatUnits(state.creditMeterReading)} kWh) and
            warns if the drift exceeds your threshold of{" "}
            {formatUnits(meterSetup.driftThreshold)} kWh.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5 sm:max-w-[14rem]">
              <Label htmlFor="physical-reading">Reading (kWh)</Label>
              <div className="relative">
                <Input
                  id="physical-reading"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  placeholder="e.g. 1038"
                  className="h-11 pr-12 sm:h-10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  kWh
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="physical-note">Note (optional)</Label>
              <Input
                id="physical-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-11 sm:h-10"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full sm:h-10 sm:w-auto"
            >
              {submitting ? "Saving…" : "Log"}
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {lastDrift !== null ? (
            <p
              className={cn(
                "text-sm",
                overThreshold
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              Drift: {formatSignedUnits(lastDrift)} kWh
              {overThreshold ? " (above threshold)" : " (within threshold)"}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}