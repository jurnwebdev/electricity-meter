import type {
  BaselineAdjustedEvent,
  BoxReadingEvent,
  CheckinEvent,
  Event,
  EventType,
  PhysicalMeterEvent,
  RechargeEvent,
} from "./types";
import { computeRate, driftKwh, projectedReadings, reduceEvents, round2, type State } from "./calculations";

export function buildCheckinEvent(
  state: State,
  newRemaining: number,
  date: string,
  now: number
): CheckinEvent {
  const projected = projectedReadings(state, newRemaining);
  return {
    type: "checkin",
    appUnitsRemaining: newRemaining,
    derivedCreditReading: projected.credit,
    derivedUsageReading: projected.usage,
    consumedSinceLast: projected.consumed - state.consumedThisBatch,
    date,
    createdAt: now,
  };
}

export function buildRechargeEvent(
  state: State,
  units: number,
  costNgn: number,
  note: string | null,
  date: string,
  now: number
): RechargeEvent {
  return {
    type: "recharge",
    units,
    costNgn,
    ratePerKwh: computeRate(units, costNgn),
    resetsUsageMeter: true,
    newAppUnitsRemaining: state.appUnitsRemaining + units,
    note,
    date,
    createdAt: now,
  };
}

export function buildPhysicalMeterEvent(
  state: State,
  physicalReading: number,
  note: string | null,
  date: string,
  now: number
): PhysicalMeterEvent {
  return {
    type: "physical_meter",
    creditMeterReading: physicalReading,
    driftKwh: driftKwh(state, physicalReading),
    note,
    date,
    createdAt: now,
  };
}

export function buildOnboardingEvent(
  credit: number,
  usage: number,
  appRemaining: number,
  date: string,
  now: number
): Event {
  return {
    type: "onboarding",
    creditMeterReading: credit,
    usageMeterReading: usage,
    appUnitsRemaining: appRemaining,
    date,
    createdAt: now,
  };
}

export function buildBaselineAdjustedEvent(
  credit: number,
  usage: number,
  appRemaining: number,
  note: string | null,
  date: string,
  now: number
): BaselineAdjustedEvent {
  return {
    type: "baseline_adjusted",
    creditMeterReading: credit,
    usageMeterReading: usage,
    appUnitsRemaining: appRemaining,
    note,
    date,
    createdAt: now,
  };
}

export function buildBoxReadingEvent(
  state: State,
  boxUnitsRemaining: number,
  date: string,
  now: number
): BoxReadingEvent {
  const appAt = state.appUnitsRemaining;
  return {
    type: "box_reading",
    boxUnitsRemaining,
    appUnitsRemainingAtLog: appAt,
    otherPersonShare: round2(boxUnitsRemaining - appAt),
    date,
    createdAt: now,
  };
}

export function filterEvents(
  events: Event[],
  filters: { type?: EventType | "all"; from?: string; to?: string }
): Event[] {
  return events.filter((e) => {
    if (filters.type && filters.type !== "all" && e.type !== filters.type) {
      return false;
    }
    if (filters.from && e.date < filters.from) {
      return false;
    }
    if (filters.to && e.date > filters.to) {
      return false;
    }
    return true;
  });
}

export function sortEventsNewestFirst(events: Event[]): Event[] {
  return [...events].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });
}

export function lastEvent(events: Event[]): Event | null {
  if (events.length === 0) {
    return null;
  }
  const sorted = sortEventsNewestFirst(events);
  return sorted[0] ?? null;
}

export { reduceEvents };