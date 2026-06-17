"use client";

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb } from "./client";
import type { MeterSetup } from "../types";

const DEFAULT_METER_SETUP: Omit<MeterSetup, "reminderEmail"> = {
  creditMeterName: "Credit meter",
  usageMeterName: "Usage meter",
  driftThreshold: 0.5,
  reminderHour: 20,
};

export function buildDefaultMeterSetup(email: string): MeterSetup {
  return { ...DEFAULT_METER_SETUP, reminderEmail: email };
}

export function useMeterSetup(uid: string | null): {
  meterSetup: MeterSetup | null;
  loading: boolean;
} {
  const [meterSetup, setMeterSetup] = useState<MeterSetup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setMeterSetup(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "users", uid),
      (snap) => {
        const data = snap.data();
        if (data && data.meterSetup) {
          setMeterSetup(data.meterSetup as MeterSetup);
        } else {
          setMeterSetup(null);
        }
        setLoading(false);
      },
      () => {
        setMeterSetup(null);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { meterSetup, loading };
}

export async function setMeterSetup(
  uid: string,
  meterSetup: MeterSetup
): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "users", uid),
    { meterSetup },
    { merge: true }
  );
}

export async function clearMeterSetup(uid: string): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "users", uid),
    { meterSetup: null },
    { merge: true }
  );
}

export async function setReminderEnabled(
  uid: string,
  enabled: boolean
): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "users", uid),
    { reminderEnabled: enabled, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function setDriftThreshold(
  uid: string,
  value: number
): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "users", uid),
    { "meterSetup.driftThreshold": value },
    { merge: true }
  );
}

export async function setReminderHour(
  uid: string,
  value: number
): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "users", uid),
    { "meterSetup.reminderHour": value },
    { merge: true }
  );
}

export async function legacyDeriveAppRemaining(
  uid: string
): Promise<{ remaining: number; hasLegacy: boolean }> {
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "users", uid, "entries"))
  );
  if (snap.empty) {
    return { remaining: 0, hasLegacy: false };
  }
  let recharges = 0;
  let usages = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const units = Number(data.units) || 0;
    if (data.type === "recharge") {
      recharges += units;
    } else if (data.type === "usage") {
      usages += units;
    }
  }
  return { remaining: recharges - usages, hasLegacy: true };
}
