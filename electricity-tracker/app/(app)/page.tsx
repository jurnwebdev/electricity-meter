"use client";

import { useAuthUser } from "@/lib/firebase/auth";
import { useEntries } from "@/lib/firebase/entries";
import { useRate } from "@/lib/firebase/settings";
import { StatCard } from "@/components/stat-card";
import { QuickLogRecharge } from "@/components/quick-log-recharge";
import { QuickLogUsage } from "@/components/quick-log-usage";
import { RecentActivity } from "@/components/recent-activity";
import { Card, CardContent } from "@/components/ui/card";
import {
  dailyAverage,
  daysLeft,
  monthlySpend,
  remainingUnits,
  remainingUnitsClass,
  weeklySpend,
} from "@/lib/calculations";
import { formatInteger, formatNaira, formatUnits } from "@/lib/format";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const uid = user?.uid ?? null;
  const { entries } = useEntries(uid);
  const { rate } = useRate(uid);

  const remaining = remainingUnits(entries);
  const days = daysLeft(entries);
  const monthly = monthlySpend(entries);
  const daily = dailyAverage(entries);
  const weekly = weeklySpend(entries);

  const remainingTone = remainingUnitsClass(remaining);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your remaining units and recent spend at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Remaining units"
          value={`${formatUnits(remaining)} kWh`}
          tone={remainingTone}
          hint={remainingTone === "bad" ? "Low — consider recharging soon" : undefined}
        />
        <StatCard
          label="Estimated days left"
          value={formatInteger(days)}
          hint={days === null ? "Not enough usage data" : `Based on last 30 days`}
        />
        <StatCard
          label="Monthly spend"
          value={formatNaira(monthly)}
          hint={`Last 7 days: ${formatNaira(weekly)}`}
        />
        <StatCard
          label="Daily average"
          value={`${formatUnits(daily)} kWh`}
          hint="Last 30 days, usage only"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <QuickLogRecharge uid={uid!} rate={rate} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <QuickLogUsage uid={uid!} />
          </CardContent>
        </Card>
      </div>

      <RecentActivity entries={entries} />
    </div>
  );
}
