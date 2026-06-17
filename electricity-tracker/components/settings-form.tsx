"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  setDriftThreshold,
  setReminderHour as saveReminderHour,
  clearMeterSetup,
} from "@/lib/firebase/settings";
import { createEvent } from "@/lib/firebase/events";
import { buildBaselineAdjustedEvent } from "@/lib/events";
import { today } from "@/lib/date";
import { formatUnits } from "@/lib/format";
import { reduceEvents } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import type { Event, MeterSetup } from "@/lib/types";

type Props = {
  uid: string;
  meterSetup: MeterSetup;
  events: Event[];
};

export function SettingsForm({ uid, meterSetup, events }: Props) {
  const [threshold, setThreshold] = useState(meterSetup.driftThreshold.toString());
  const [reminderHour, setReminderHour] = useState(meterSetup.reminderHour.toString());
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  const [reminderMsg, setReminderMsg] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  const [creditBaseline, setCreditBaseline] = useState(
    reduceEvents(events).creditMeterReading.toString()
  );
  const [usageBaseline, setUsageBaseline] = useState(
    reduceEvents(events).usageMeterReading.toString()
  );
  const [appBaseline, setAppBaseline] = useState(
    reduceEvents(events).appUnitsRemaining.toString()
  );
  const [baselineNote, setBaselineNote] = useState("");
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [baselineMsg, setBaselineMsg] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);
  const [resetting, setResetting] = useState(false);

  async function handleSaveThreshold(e: React.FormEvent) {
    e.preventDefault();
    setThresholdMsg(null);
    const n = Number.parseFloat(threshold);
    if (!Number.isFinite(n) || n < 0 || n > 10) {
      setThresholdMsg({ tone: "err", text: "Threshold must be between 0 and 10 kWh." });
      return;
    }
    setSavingThreshold(true);
    try {
      await setDriftThreshold(uid, n);
      setThresholdMsg({ tone: "ok", text: "Saved." });
    } catch {
      setThresholdMsg({ tone: "err", text: "Could not save." });
    } finally {
      setSavingThreshold(false);
    }
  }

  async function handleSaveReminder(e: React.FormEvent) {
    e.preventDefault();
    setReminderMsg(null);
    const n = Number.parseInt(reminderHour, 10);
    if (!Number.isFinite(n) || n < 0 || n > 23) {
      setReminderMsg({ tone: "err", text: "Hour must be between 0 and 23." });
      return;
    }
    setSavingReminder(true);
    try {
      await saveReminderHour(uid, n);
      setReminderMsg({ tone: "ok", text: "Saved." });
    } catch {
      setReminderMsg({ tone: "err", text: "Could not save." });
    } finally {
      setSavingReminder(false);
    }
  }

  async function handleSaveBaseline(e: React.FormEvent) {
    e.preventDefault();
    setBaselineMsg(null);
    const c = Number.parseFloat(creditBaseline);
    const u = Number.parseFloat(usageBaseline);
    const a = Number.parseFloat(appBaseline);
    if (
      !Number.isFinite(c) || c < 0 ||
      !Number.isFinite(u) || u < 0 ||
      !Number.isFinite(a) || a < 0
    ) {
      setBaselineMsg({ tone: "err", text: "All values must be zero or greater." });
      return;
    }
    setSavingBaseline(true);
    try {
      const ev = buildBaselineAdjustedEvent(
        c,
        u,
        a,
        baselineNote.trim() === "" ? null : baselineNote.trim(),
        today(),
        Date.now()
      );
      await createEvent(uid, ev);
      setBaselineNote("");
      setBaselineMsg({ tone: "ok", text: "Baseline updated." });
    } catch (err) {
      console.error(err);
      setBaselineMsg({ tone: "err", text: "Could not save." });
    } finally {
      setSavingBaseline(false);
    }
  }

  async function handleResetMeterSetup() {
    if (
      !confirm(
        "Clear meter setup? Your events stay, but you'll go through onboarding on next visit."
      )
    ) {
      return;
    }
    setResetting(true);
    try {
      await clearMeterSetup(uid);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card size="sm" className="shadow-card">
        <CardHeader>
          <CardTitle>Meter setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Credit meter
              </dt>
              <dd className="mt-1 font-medium">{meterSetup.creditMeterName}</dd>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Usage meter
              </dt>
              <dd className="mt-1 font-medium">{meterSetup.usageMeterName}</dd>
            </div>
          </dl>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetMeterSetup}
              disabled={resetting}
            >
              {resetting ? "Resetting…" : "Switch meter setup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card size="sm" className="shadow-card">
        <CardHeader>
          <CardTitle>Drift threshold</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveThreshold} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Show a warning when a physical credit meter reading differs from
              the derived value by more than this. Current:{" "}
              <span className="font-medium text-foreground">
                {formatUnits(meterSetup.driftThreshold)} kWh
              </span>
              .
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-32">
                <Label htmlFor="drift-threshold">Threshold (kWh)</Label>
                <Input
                  id="drift-threshold"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={savingThreshold}
                className="h-10 sm:w-auto"
              >
                {savingThreshold ? "Saving…" : "Save"}
              </Button>
            </div>
            {thresholdMsg ? <FormMessage tone={thresholdMsg.tone} text={thresholdMsg.text} /> : null}
          </form>
        </CardContent>
      </Card>

      <Card size="sm" className="shadow-card">
        <CardHeader>
          <CardTitle>Daily reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveReminder} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Hour of the day to send a reminder email to log today's reading.
              Currently:{" "}
              <span className="font-medium text-foreground">
                {meterSetup.reminderHour}:00
              </span>
              .
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-32">
                <Label htmlFor="reminder-hour">Hour (0–23)</Label>
                <Input
                  id="reminder-hour"
                  type="number"
                  min="0"
                  max="23"
                  required
                  value={reminderHour}
                  onChange={(e) => setReminderHour(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={savingReminder}
                className="h-10 sm:w-auto"
              >
                {savingReminder ? "Saving…" : "Save"}
              </Button>
            </div>
            {reminderMsg ? <FormMessage tone={reminderMsg.tone} text={reminderMsg.text} /> : null}
          </form>
        </CardContent>
      </Card>

      <Card size="sm" className="shadow-card">
        <CardHeader>
          <CardTitle>Adjust baseline</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBaseline} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Re-enter the three values to overwrite the baseline. Useful if
              your first readings were off. This adds a baseline-adjusted event
              — it does not delete history.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="baseline-credit">Credit meter (kWh)</Label>
                <Input
                  id="baseline-credit"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={creditBaseline}
                  onChange={(e) => setCreditBaseline(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="baseline-usage">Usage meter (kWh)</Label>
                <Input
                  id="baseline-usage"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={usageBaseline}
                  onChange={(e) => setUsageBaseline(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="baseline-app">App remaining (kWh)</Label>
                <Input
                  id="baseline-app"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={appBaseline}
                  onChange={(e) => setAppBaseline(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="baseline-note">Note (optional)</Label>
              <Input
                id="baseline-note"
                type="text"
                value={baselineNote}
                onChange={(e) => setBaselineNote(e.target.value)}
                placeholder="Why are you adjusting?"
                className="h-10"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={savingBaseline}
                className="h-10 w-full sm:w-auto"
              >
                {savingBaseline ? "Saving…" : "Adjust baseline"}
              </Button>
            </div>
            {baselineMsg ? <FormMessage tone={baselineMsg.tone} text={baselineMsg.text} /> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormMessage({ tone, text }: { tone: "ok" | "err"; text: string }) {
  return (
    <p
      className={cn(
        "text-sm",
        tone === "ok"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-destructive"
      )}
    >
      {text}
    </p>
  );
}