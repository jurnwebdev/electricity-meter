import type {
  BaselineAdjustedEvent,
  CheckinEvent,
  Event,
  PhysicalMeterEvent,
  RechargeEvent,
} from "./types";
import { compareDateKeys, daysAgoKey, monthStart } from "./date";

export type State = {
  appUnitsRemaining: number;
  creditMeterReading: number;
  usageMeterReading: number;
  consumedThisBatch: number;
  lastBoxReading: number | null;
  lastEventType: Event["type"] | null;
  lastEventAt: number | null;
};

export const INITIAL_STATE: State = {
  appUnitsRemaining: 0,
  creditMeterReading: 0,
  usageMeterReading: 0,
  consumedThisBatch: 0,
  lastBoxReading: null,
  lastEventType: null,
  lastEventAt: null,
};

function applyOne(state: State, event: Event): State {
  switch (event.type) {
    case "onboarding": {
      return {
        ...state,
        appUnitsRemaining: event.appUnitsRemaining,
        creditMeterReading: event.creditMeterReading,
        usageMeterReading: event.usageMeterReading,
        consumedThisBatch: event.usageMeterReading,
        lastEventType: event.type,
        lastEventAt: event.createdAt,
      };
    }
    case "baseline_adjusted": {
      return {
        ...state,
        appUnitsRemaining: event.appUnitsRemaining,
        creditMeterReading: event.creditMeterReading,
        usageMeterReading: event.usageMeterReading,
        consumedThisBatch: event.usageMeterReading,
        lastEventType: event.type,
        lastEventAt: event.createdAt,
      };
    }
    case "recharge": {
      return {
        ...state,
        appUnitsRemaining: event.newAppUnitsRemaining,
        usageMeterReading: 0,
        consumedThisBatch: 0,
        lastEventType: event.type,
        lastEventAt: event.createdAt,
      };
    }
    case "checkin": {
      return {
        ...state,
        appUnitsRemaining: event.appUnitsRemaining,
        creditMeterReading: event.derivedCreditReading,
        usageMeterReading: event.derivedUsageReading,
        consumedThisBatch: event.derivedUsageReading,
        lastEventType: event.type,
        lastEventAt: event.createdAt,
      };
    }
    case "physical_meter": {
      return {
        ...state,
        lastEventType: event.type,
        lastEventAt: event.createdAt,
      };
    }
    case "box_reading": {
      return {
        ...state,
        lastBoxReading: event.boxUnitsRemaining,
        lastEventType: event.type,
        lastEventAt: event.createdAt,
      };
    }
  }
}

export function reduceEvents(events: Event[]): State {
  const sorted = [...events].sort((a, b) => {
    const byDate = compareDateKeys(a.date, b.date);
    if (byDate !== 0) {
      return byDate;
    }
    return a.createdAt - b.createdAt;
  });
  return sorted.reduce<State>(applyOne, INITIAL_STATE);
}

export function consumedSinceLast(state: State, newRemaining: number): number {
  if (state.lastEventType === null) {
    return 0;
  }
  const delta = state.appUnitsRemaining - newRemaining;
  return delta > 0 ? round2(delta) : 0;
}

export function projectedReadings(
  state: State,
  newRemaining: number
): { credit: number; usage: number; consumed: number } {
  const consumed = consumedSinceLast(state, newRemaining);
  return {
    credit: round2(state.creditMeterReading + consumed),
    usage: round2(state.usageMeterReading + consumed),
    consumed: round2(state.consumedThisBatch + consumed),
  };
}

export function daysLeft(state: State, recent: CheckinEvent[]): number | null {
  if (recent.length === 0) {
    return null;
  }
  const byDay = new Map<string, number>();
  for (const ev of recent) {
    const day = ev.date;
    byDay.set(day, (byDay.get(day) ?? 0) + ev.consumedSinceLast);
  }
  const total = Array.from(byDay.values()).reduce((s, n) => s + n, 0);
  const days = byDay.size;
  if (days === 0) {
    return null;
  }
  const avg = total / days;
  if (avg <= 0) {
    return null;
  }
  return Math.floor(state.appUnitsRemaining / avg);
}

export function recentCheckins(
  events: Event[],
  now: Date = new Date()
): CheckinEvent[] {
  const from = daysAgoKey(30, now);
  return events
    .filter((e): e is CheckinEvent => e.type === "checkin" && e.date >= from)
    .sort((a, b) => compareDateKeys(b.date, a.date));
}

export function monthlySpend(events: Event[], now: Date = new Date()): number {
  const from = monthStart(now);
  return events
    .filter(
      (e): e is RechargeEvent => e.type === "recharge" && e.date >= from
    )
    .reduce((sum, e) => sum + e.costNgn, 0);
}

export function weeklySpend(events: Event[], now: Date = new Date()): number {
  const from = daysAgoKey(7, now);
  return events
    .filter(
      (e): e is RechargeEvent => e.type === "recharge" && e.date >= from
    )
    .reduce((sum, e) => sum + e.costNgn, 0);
}

export function totalConsumed(events: Event[]): number {
  return events
    .filter((e): e is CheckinEvent => e.type === "checkin")
    .reduce((sum, e) => sum + e.consumedSinceLast, 0);
}

export function totalRechargeCost(events: Event[]): number {
  return events
    .filter((e): e is RechargeEvent => e.type === "recharge")
    .reduce((sum, e) => sum + e.costNgn, 0);
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

export function driftKwh(
  state: State,
  physicalReading: number
): number {
  return round2(state.creditMeterReading - physicalReading);
}

export function computeRate(units: number, cost: number): number {
  if (!Number.isFinite(units) || units <= 0 || !Number.isFinite(cost) || cost <= 0) {
    return 0;
  }
  return round2(cost / units);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
