"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createEvent } from "@/lib/firebase/events";
import { buildCheckinEvent } from "@/lib/events";
import { today } from "@/lib/date";
import { reduceEvents, remainingUnitsClass } from "@/lib/calculations";
import { formatUnits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

type Props = {
  uid: string;
  events: Event[];
};

export function LogUnitsRemaining({ uid, events }: Props) {
  const state = reduceEvents(events);
  const last = events
    .filter((e) => e.type === "checkin" || e.type === "onboarding")
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  const [value, setValue] = useState(
    state.appUnitsRemaining > 0 ? state.appUnitsRemaining.toString() : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ remaining: number; delta: number } | null>(null);
  const tone = remainingUnitsClass(state.appUnitsRemaining);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n) || n < 0) {
      setError("Units remaining must be zero or greater.");
      return;
    }
    const prev = state.appUnitsRemaining;
    setSubmitting(true);
    try {
      const ev = buildCheckinEvent(state, n, today(), Date.now());
      await createEvent(uid, ev);
      setSuccess({ remaining: n, delta: n - prev });
      if (n > 0) {
        setValue(n.toString());
      }
    } catch (err) {
      console.error(err);
      setError("Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card size="sm" className="shadow-card">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Units remaining
          </p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              tone === "good" &&
                "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              tone === "warn" &&
                "bg-amber-500/10 text-amber-600 dark:text-amber-400",
              tone === "bad" && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            {tone === "good" ? "Healthy" : tone === "warn" ? "Low" : "Critical"}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="checkin-units" className="sr-only">
              Units remaining in kWh
            </Label>
            <div className="relative">
              <Input
                id="checkin-units"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 55"
                className="h-11 pr-12 text-base sm:h-10 sm:text-sm"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                kWh
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {last
                ? `Last logged: ${formatUnits(
                    last.type === "checkin" || last.type === "onboarding"
                      ? last.appUnitsRemaining
                      : 0
                  )} kWh · ${last.date}`
                : "No check-ins yet."}
            </p>
            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full sm:h-9 sm:w-auto"
            >
              {submitting ? "Saving…" : "Log reading"}
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Logged {formatUnits(success.remaining)} kWh
              {success.delta !== 0
                ? ` (${success.delta > 0 ? "+" : ""}${formatUnits(success.delta)} kWh)`
                : null}
              .
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

export { remainingUnitsClass };