"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb } from "./client";
import { today } from "../date";
import type { Event, EventDoc, EventType } from "../types";

function fromDoc(id: string, raw: EventDoc): Event | null {
  const type = raw.type as EventType | undefined;
  if (!type) {
    return null;
  }
  const createdAt =
    typeof raw.createdAt === "object" &&
    raw.createdAt !== null &&
    "toMillis" in raw.createdAt &&
    typeof (raw.createdAt as { toMillis: () => number }).toMillis === "function"
      ? (raw.createdAt as { toMillis: () => number }).toMillis()
      : typeof raw.createdAt === "number"
        ? raw.createdAt
        : Date.now();

  const base = {
    id,
    type,
    date: typeof raw.date === "string" ? raw.date : today(),
    createdAt,
  };

  switch (type) {
    case "onboarding": {
      return {
        ...base,
        type: "onboarding",
        creditMeterReading: Number(raw.creditMeterReading) || 0,
        usageMeterReading: Number(raw.usageMeterReading) || 0,
        appUnitsRemaining: Number(raw.appUnitsRemaining) || 0,
      };
    }
    case "checkin": {
      return {
        ...base,
        type: "checkin",
        appUnitsRemaining: Number(raw.appUnitsRemaining) || 0,
        derivedCreditReading: Number(raw.derivedCreditReading) || 0,
        derivedUsageReading: Number(raw.derivedUsageReading) || 0,
        consumedSinceLast: Number(raw.consumedSinceLast) || 0,
      };
    }
    case "recharge": {
      return {
        ...base,
        type: "recharge",
        units: Number(raw.units) || 0,
        costNgn: Number(raw.costNgn) || 0,
        ratePerKwh: Number(raw.ratePerKwh) || 0,
        resetsUsageMeter: true,
        newAppUnitsRemaining: Number(raw.newAppUnitsRemaining) || 0,
        note: (raw.note as string | null) ?? null,
      };
    }
    case "physical_meter": {
      return {
        ...base,
        type: "physical_meter",
        creditMeterReading: Number(raw.creditMeterReading) || 0,
        driftKwh: Number(raw.driftKwh) || 0,
        note: (raw.note as string | null) ?? null,
      };
    }
    case "box_reading": {
      return {
        ...base,
        type: "box_reading",
        boxUnitsRemaining: Number(raw.boxUnitsRemaining) || 0,
        appUnitsRemainingAtLog: Number(raw.appUnitsRemainingAtLog) || 0,
        otherPersonShare: Number(raw.otherPersonShare) || 0,
      };
    }
    case "baseline_adjusted": {
      return {
        ...base,
        type: "baseline_adjusted",
        creditMeterReading: Number(raw.creditMeterReading) || 0,
        usageMeterReading: Number(raw.usageMeterReading) || 0,
        appUnitsRemaining: Number(raw.appUnitsRemaining) || 0,
        note: (raw.note as string | null) ?? null,
      };
    }
  }
}

export function useEvents(uid: string | null): {
  events: Event[];
  loading: boolean;
} {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setEvents([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(getFirebaseDb(), "users", uid, "events"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const out: Event[] = [];
        for (const d of snap.docs) {
          const ev = fromDoc(d.id, d.data() as EventDoc);
          if (ev) {
            out.push(ev);
          }
        }
        setEvents(out);
        setLoading(false);
      },
      () => {
        setEvents([]);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { events, loading };
}

export async function createEvent(
  uid: string,
  data: Record<string, unknown>
): Promise<void> {
  await addDoc(collection(getFirebaseDb(), "users", uid, "events"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateEventFields(
  uid: string,
  eventId: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "users", uid, "events", eventId), data);
}

export async function deleteEvent(uid: string, eventId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), "users", uid, "events", eventId));
}

export { where };

export function defaultEventDate(): string {
  return today();
}
