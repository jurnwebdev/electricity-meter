"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/firebase/auth";
import {
  useMeterSetup,
  buildDefaultMeterSetup,
  legacyDeriveAppRemaining,
  setMeterSetup,
} from "@/lib/firebase/settings";
import { createEvent } from "@/lib/firebase/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { today } from "@/lib/date";
import { buildOnboardingEvent } from "@/lib/events";
import { cn } from "@/lib/utils";

type Step = "type" | "readings";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { meterSetup, loading } = useMeterSetup(uid);
  const [step, setStep] = useState<Step>("type");
  const [mode, setMode] = useState<"single" | "dual" | null>(null);
  const [credit, setCredit] = useState("");
  const [usage, setUsage] = useState("");
  const [appRemaining, setAppRemaining] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legacyHint, setLegacyHint] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && meterSetup) {
      router.replace("/");
    }
  }, [meterSetup, loading, router]);

  useEffect(() => {
    if (!uid) {
      return;
    }
    void legacyDeriveAppRemaining(uid).then((res) => {
      if (res.hasLegacy) {
        setAppRemaining(res.remaining.toString());
        setLegacyHint(
          "We found entries from before dual-meter mode. Your current 'units remaining' is pre-filled using recharges minus usage. Old entries will be hidden from History once you finish setup."
        );
      }
    });
  }, [uid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!uid || !user || !mode) {
      return;
    }
    if (mode === "single") {
      setSubmitting(true);
      try {
        await setMeterSetup(uid, buildDefaultMeterSetup(user.email ?? ""));
        router.replace("/");
      } catch (err) {
        console.error(err);
        setError("Could not save. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    const c = Number.parseFloat(credit);
    const u = Number.parseFloat(usage);
    const a = Number.parseFloat(appRemaining);
    if (!Number.isFinite(c) || c <= 0) {
      setError("Credit meter reading must be greater than zero.");
      return;
    }
    if (!Number.isFinite(u) || u < 0) {
      setError("Usage meter reading must be zero or greater.");
      return;
    }
    if (!Number.isFinite(a) || a < 0) {
      setError("App units remaining must be zero or greater.");
      return;
    }

    setSubmitting(true);
    try {
      await setMeterSetup(uid, buildDefaultMeterSetup(user.email ?? ""));
      const ev = buildOnboardingEvent(c, u, a, today(), Date.now());
      await createEvent(uid, ev);
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Could not save. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading || meterSetup) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl py-8 sm:py-12">
      <div className="mb-6 flex items-center gap-3 sm:mb-8">
        <StepBubble active={step === "type"} done={step === "readings"} index={1} />
        <div className="h-px flex-1 bg-border" />
        <StepBubble active={step === "readings"} done={false} index={2} />
      </div>

      <div className="mb-6 space-y-1.5 sm:mb-8">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {step === "type" ? "Set up your meters" : "Initial readings"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {step === "type"
            ? "Tell us how you read your electricity usage."
            : "Enter the current readings from your physical meters and the app."}
        </p>
      </div>

      {step === "type" ? (
        <div className="space-y-4">
          <ModeCard
            selected={mode === "single"}
            onSelect={() => setMode("single")}
            title="Single meter"
            description="Track recharges and usages the simple way. Just totals."
          />
          <ModeCard
            selected={mode === "dual"}
            onSelect={() => setMode("dual")}
            title="Dual meter"
            description="I have two physical meters: one cumulative (credit), one resettable (usage). I'll only log my 'units remaining' — the rest is auto-derived."
          />

          {legacyHint ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              {legacyHint}
            </div>
          ) : null}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setStep("readings")}
              disabled={mode === null}
              className="h-11 px-6 sm:h-10"
            >
              Continue
            </Button>
          </div>
        </div>
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {mode === "single" ? "You're set" : "Enter your current readings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "single" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Single-meter mode doesn't need any readings. You can start
                  logging recharges and usages from the dashboard.
                </p>
                <form onSubmit={handleSubmit} className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 sm:h-10"
                  >
                    {submitting ? "Setting up…" : "Go to dashboard"}
                  </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {legacyHint ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                    {legacyHint}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="credit">Credit meter reading (kWh)</Label>
                    <Input
                      id="credit"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required
                      value={credit}
                      onChange={(e) => setCredit(e.target.value)}
                      placeholder="e.g. 1023"
                      className="h-11 sm:h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      The cumulative meter. Never reset.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="usage">Usage meter reading (kWh)</Label>
                    <Input
                      id="usage"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required
                      value={usage}
                      onChange={(e) => setUsage(e.target.value)}
                      placeholder="e.g. 7.3"
                      className="h-11 sm:h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      The resettable meter since your last top-up.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="app">App units remaining (kWh)</Label>
                    <Input
                      id="app"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      required
                      value={appRemaining}
                      onChange={(e) => setAppRemaining(e.target.value)}
                      placeholder="e.g. 60"
                      className="h-11 sm:h-10"
                    />
                  </div>
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("type")}
                    className="h-11 sm:h-10"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-11 px-6 sm:h-10"
                  >
                    {submitting ? "Saving…" : "Finish setup"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepBubble({
  active,
  done,
  index,
}: {
  active: boolean;
  done: boolean;
  index: number;
}) {
  return (
    <div
      className={cn(
        "grid size-8 place-items-center rounded-full text-xs font-semibold transition-colors",
        done && "bg-primary text-primary-foreground",
        active && !done && "border-2 border-primary bg-background text-primary",
        !active && !done && "border border-border bg-muted text-muted-foreground"
      )}
    >
      {done ? (
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
          <path
            d="M5 12l4 4L19 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        index
      )}
    </div>
  );
}

function ModeCard({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left transition-all",
        selected
          ? "border-primary shadow-card ring-2 ring-primary/20"
          : "border-border/60 hover:border-border hover:bg-muted/30"
      )}
    >
      <div
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        {selected ? (
          <svg viewBox="0 0 24 24" fill="none" className="size-4">
            <path
              d="M5 12l4 4L19 6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}