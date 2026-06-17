import type { Entry } from "./types";
import { compareDateKeys, daysAgoKey, monthStart } from "./date";

export function totalRechargeUnits(entries: Entry[]): number {
  return entries
    .filter((e) => e.type === "recharge")
    .reduce((sum, e) => sum + e.units, 0);
}

export function totalUsageUnits(entries: Entry[]): number {
  return entries
    .filter((e) => e.type === "usage")
    .reduce((sum, e) => sum + e.units, 0);
}

export function remainingUnits(entries: Entry[]): number {
  return totalRechargeUnits(entries) - totalUsageUnits(entries);
}

export function usageInWindow(entries: Entry[], fromDateKey: string): number {
  return entries
    .filter((e) => e.type === "usage" && e.entryDate >= fromDateKey)
    .reduce((sum, e) => sum + e.units, 0);
}

export function dailyAverage(entries: Entry[], now: Date = new Date()): number {
  const from = daysAgoKey(30, now);
  return usageInWindow(entries, from) / 30;
}

export function daysLeft(entries: Entry[], now: Date = new Date()): number | null {
  const avg = dailyAverage(entries, now);
  if (avg <= 0) {
    return null;
  }
  return Math.floor(remainingUnits(entries) / avg);
}

export function spendInWindow(
  entries: Entry[],
  fromDateKey: string
): number {
  return entries
    .filter((e) => e.type === "recharge" && e.entryDate >= fromDateKey)
    .reduce((sum, e) => sum + e.costNgn, 0);
}

export function monthlySpend(entries: Entry[], now: Date = new Date()): number {
  return spendInWindow(entries, monthStart(now));
}

export function weeklySpend(entries: Entry[], now: Date = new Date()): number {
  return spendInWindow(entries, daysAgoKey(7, now));
}

export function remainingUnitsClass(remaining: number): "good" | "warn" | "bad" {
  if (remaining < 5) {
    return "bad";
  }
  if (remaining < 20) {
    return "warn";
  }
  return "good";
}

export function recentEntries(entries: Entry[], limit = 5): Entry[] {
  return [...entries].sort((a, b) => {
    const byDate = compareDateKeys(b.entryDate, a.entryDate);
    if (byDate !== 0) {
      return byDate;
    }
    return b.createdAt - a.createdAt;
  }).slice(0, limit);
}

export function filterEntries(
  entries: Entry[],
  filters: { type?: "recharge" | "usage" | "all"; from?: string; to?: string }
): Entry[] {
  return entries.filter((e) => {
    if (filters.type && filters.type !== "all" && e.type !== filters.type) {
      return false;
    }
    if (filters.from && e.entryDate < filters.from) {
      return false;
    }
    if (filters.to && e.entryDate > filters.to) {
      return false;
    }
    return true;
  });
}

export function computeCost(
  units: number,
  rate: number,
  manualCost: number | null | undefined
): number {
  if (manualCost != null && manualCost > 0) {
    return round2(manualCost);
  }
  if (rate > 0) {
    return round2(units * rate);
  }
  return 0;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
