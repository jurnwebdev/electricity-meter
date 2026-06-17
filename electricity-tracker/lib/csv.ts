import type { Event, EventType } from "./types";

const COLUMNS = [
  "event_type",
  "date",
  "app_units_remaining",
  "app_units_remaining_at_log",
  "credit_meter_reading",
  "usage_meter_reading",
  "box_units_remaining",
  "other_person_share",
  "units_purchased",
  "cost_ngn",
  "rate_per_kwh",
  "drift_kwh",
  "consumed_since_last",
  "note",
] as const;

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function num(n: number | undefined): string {
  if (n === undefined || n === null || !Number.isFinite(n)) {
    return "";
  }
  return n.toFixed(2);
}

export function eventsToCsv(events: Event[]): string {
  const rows: string[] = [COLUMNS.join(",")];
  for (const e of events) {
    const cells: string[] = [
      e.type,
      e.date,
      appRemainingFor(e),
      appRemainingAtLogFor(e),
      creditFor(e),
      usageFor(e),
      boxReadingFor(e),
      otherShareFor(e),
      "units" in e ? num(e.units) : "",
      "costNgn" in e ? num(e.costNgn) : "",
      "ratePerKwh" in e ? num(e.ratePerKwh) : "",
      "driftKwh" in e ? num(e.driftKwh) : "",
      "consumedSinceLast" in e ? num(e.consumedSinceLast) : "",
      "note" in e && e.note ? e.note : "",
    ];
    rows.push(cells.map(String).map(escapeField).join(","));
  }
  return rows.join("\r\n") + "\r\n";
}

function appRemainingFor(e: Event): string {
  if (e.type === "recharge") {
    return num(e.newAppUnitsRemaining);
  }
  if (
    e.type === "checkin" ||
    e.type === "onboarding" ||
    e.type === "baseline_adjusted"
  ) {
    return num(e.appUnitsRemaining);
  }
  return "";
}

function appRemainingAtLogFor(e: Event): string {
  if (e.type === "box_reading") {
    return num(e.appUnitsRemainingAtLog);
  }
  return "";
}

function boxReadingFor(e: Event): string {
  if (e.type === "box_reading") {
    return num(e.boxUnitsRemaining);
  }
  return "";
}

function otherShareFor(e: Event): string {
  if (e.type === "box_reading") {
    return num(e.otherPersonShare);
  }
  return "";
}

function creditFor(e: Event): string {
  if (e.type === "onboarding" || e.type === "baseline_adjusted") {
    return num(e.creditMeterReading);
  }
  if (e.type === "checkin") {
    return num(e.derivedCreditReading);
  }
  if (e.type === "physical_meter") {
    return num(e.creditMeterReading);
  }
  return "";
}

function usageFor(e: Event): string {
  if (e.type === "onboarding" || e.type === "baseline_adjusted") {
    return num(e.usageMeterReading);
  }
  if (e.type === "checkin") {
    return num(e.derivedUsageReading);
  }
  return "";
}

export function downloadCsv(events: Event[]): void {
  const csv = eventsToCsv(events);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `electricity-history-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type { EventType };
