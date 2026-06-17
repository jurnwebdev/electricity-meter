export type EntryType = "recharge" | "usage";

export type Entry = {
  id: string;
  type: EntryType;
  units: number;
  costNgn: number;
  ratePerKwh: number;
  note: string | null;
  entryDate: string;
  createdAt: number;
};

export type MeterSetup = {
  creditMeterName: "Credit meter";
  usageMeterName: "Usage meter";
  driftThreshold: number;
  reminderHour: number;
  reminderEmail: string;
};

export type OnboardingEvent = {
  id?: string;
  type: "onboarding";
  creditMeterReading: number;
  usageMeterReading: number;
  appUnitsRemaining: number;
  date: string;
  createdAt: number;
};

export type CheckinEvent = {
  id?: string;
  type: "checkin";
  appUnitsRemaining: number;
  derivedCreditReading: number;
  derivedUsageReading: number;
  consumedSinceLast: number;
  date: string;
  createdAt: number;
};

export type RechargeEvent = {
  id?: string;
  type: "recharge";
  units: number;
  costNgn: number;
  ratePerKwh: number;
  resetsUsageMeter: true;
  newAppUnitsRemaining: number;
  note: string | null;
  date: string;
  createdAt: number;
};

export type PhysicalMeterEvent = {
  id?: string;
  type: "physical_meter";
  creditMeterReading: number;
  driftKwh: number;
  note: string | null;
  date: string;
  createdAt: number;
};

export type BoxReadingEvent = {
  id?: string;
  type: "box_reading";
  boxUnitsRemaining: number;
  appUnitsRemainingAtLog: number;
  otherPersonShare: number;
  date: string;
  createdAt: number;
};

export type BaselineAdjustedEvent = {
  id?: string;
  type: "baseline_adjusted";
  creditMeterReading: number;
  usageMeterReading: number;
  appUnitsRemaining: number;
  note: string | null;
  date: string;
  createdAt: number;
};

export type Event =
  | OnboardingEvent
  | CheckinEvent
  | RechargeEvent
  | PhysicalMeterEvent
  | BoxReadingEvent
  | BaselineAdjustedEvent;

export type EventType = Event["type"];

export type EventDoc = {
  type: EventType;
  [key: string]: unknown;
};

export type AppUser = {
  email: string;
  defaultRate: number;
  meterSetup?: MeterSetup;
  createdAt?: number;
};
