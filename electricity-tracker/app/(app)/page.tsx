"use client";

import { useAuthUser } from "@/lib/firebase/auth";
import { useEvents } from "@/lib/firebase/events";
import { useMeterSetup } from "@/lib/firebase/settings";
import { StatCard } from "@/components/stat-card";
import { LogUnitsRemaining } from "@/components/log-units-remaining";
import { LogBoxReading } from "@/components/log-box-reading";
import { SharedBoxCard } from "@/components/shared-box-card";
import { QuickLogRecharge } from "@/components/quick-log-recharge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  daysLeft,
  monthlySpend,
  recentCheckins,
  reduceEvents,
  remainingUnitsClass,
  weeklySpend,
} from "@/lib/calculations";
import { formatInteger, formatNaira, formatRate, formatUnits } from "@/lib/format";
import { sortEventsNewestFirst } from "@/lib/events";
import { EventTable } from "@/components/event-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { events } = useEvents(uid);
  const { meterSetup } = useMeterSetup(uid);

  const state = reduceEvents(events);
  const recent = recentCheckins(events);
  const days = daysLeft(state, recent);
  const monthly = monthlySpend(events);
  const weekly = weeklySpend(events);

  const remainingTone = remainingUnitsClass(state.appUnitsRemaining);
  const latestRate = (() => {
    const recharges = events.filter((e) => e.type === "recharge");
    if (recharges.length === 0) {
      return 0;
    }
    const sorted = sortEventsNewestFirst(recharges);
    return sorted[0] && sorted[0].type === "recharge" ? sorted[0].ratePerKwh : 0;
  })();

  const userInitial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero / greeting */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-accent/40 to-background px-5 py-6 shadow-card sm:px-7 sm:py-8">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary">
                {userInitial}
              </span>
              <span>Today</span>
            </div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {state.appUnitsRemaining > 0
                ? `${formatUnits(state.appUnitsRemaining)} kWh remaining`
                : "No units logged yet"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {days !== null
                ? `At your current pace, that's about ${formatInteger(days)} more day${days === 1 ? "" : "s"}.`
                : "Log a few check-ins to see your daily average."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                remainingTone === "good" &&
                  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                remainingTone === "warn" &&
                  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                remainingTone === "bad" &&
                  "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              )}
            >
              {remainingTone === "good"
                ? "Healthy"
                : remainingTone === "warn"
                  ? "Low"
                  : "Critical"}
            </span>
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              {latestRate > 0 ? formatRate(latestRate) : "No rate yet"}
            </span>
          </div>
        </div>
      </section>

      {/* Stat row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard
          label="Days left"
          value={formatInteger(days)}
          hint={days === null ? "Need more data" : "30-day average"}
        />
        <StatCard
          label="This month"
          value={formatNaira(monthly)}
          hint={`Last 7 days: ${formatNaira(weekly)}`}
        />
        <StatCard
          label="Latest rate"
          value={latestRate > 0 ? formatRate(latestRate) : "—"}
          hint="From your last recharge"
        />
        <StatCard
          label="Logs"
          value={String(events.length)}
          hint="All-time events"
        />
      </section>

      {meterSetup ? (
        <>
          {/* Shared box — top of the action area */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Shared meter box</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SharedBoxCard events={events} />
              <LogBoxReading uid={uid!} events={events} />
            </CardContent>
          </Card>

          {/* Quick actions — daily essentials */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quick log
              </h2>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link href="/history">View history →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <LogUnitsRemaining uid={uid!} events={events} />
              <QuickLogRecharge uid={uid!} events={events} />
            </div>
          </div>
        </>
      ) : (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-start gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>Finish onboarding to start tracking.</p>
            <Button asChild size="sm">
              <Link href="/onboarding">Continue setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/history">See all →</Link>
          </Button>
        </div>
        <EventTable events={events.slice(0, 5)} showActions={false} />
      </section>
    </div>
  );
}