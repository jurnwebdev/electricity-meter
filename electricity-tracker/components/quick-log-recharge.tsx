"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createEvent } from "@/lib/firebase/events";
import { buildRechargeEvent } from "@/lib/events";
import { today } from "@/lib/date";
import { computeRate, reduceEvents } from "@/lib/calculations";
import { formatNaira, formatRate, formatUnits } from "@/lib/format";
import type { Event } from "@/lib/types";

type Props = {
  uid: string;
  events: Event[];
};

export function QuickLogRecharge({ uid, events }: Props) {
  const state = reduceEvents(events);
  const [units, setUnits] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const u = Number.parseFloat(units);
  const c = Number.parseFloat(cost);
  const rate =
    Number.isFinite(u) && u > 0 && Number.isFinite(c) && c > 0
      ? computeRate(u, c)
      : 0;
  const newRemaining =
    Number.isFinite(u) && u > 0 ? state.appUnitsRemaining + u : state.appUnitsRemaining;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!Number.isFinite(u) || u <= 0) {
      setError("Units must be greater than zero.");
      return;
    }
    if (!Number.isFinite(c) || c <= 0) {
      setError("Cost must be greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      const ev = buildRechargeEvent(
        state,
        u,
        c,
        note.trim() === "" ? null : note.trim(),
        today(),
        Date.now()
      );
      await createEvent(uid, ev);
      setUnits("");
      setCost("");
      setNote("");
      setSuccess(true);
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
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recharge
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="recharge-units">Units</Label>
              <div className="relative">
                <Input
                  id="recharge-units"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  placeholder="88.80"
                  className="h-11 pr-10 text-base sm:h-10 sm:text-sm"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  kWh
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recharge-cost">Cost</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  ₦
                </span>
                <Input
                  id="recharge-cost"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="20000"
                  className="h-11 pl-7 text-base sm:h-10 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="recharge-note">Note (optional)</Label>
            <Input
              id="recharge-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. November top-up"
              className="h-11 sm:h-10"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-mono tabular-nums text-foreground">
                {rate > 0 ? formatRate(rate) : "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">New</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatUnits(newRemaining)} kWh
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-mono tabular-nums text-foreground">
                {Number.isFinite(c) && c > 0 ? formatNaira(c) : "—"}
              </span>
            </div>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full sm:h-9"
          >
            {submitting ? "Saving…" : "Log recharge"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Recharge logged.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}