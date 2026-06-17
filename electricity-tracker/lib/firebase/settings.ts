"use client";

import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFirebaseDb } from "./client";

export function useRate(uid: string | null): { rate: number; loading: boolean } {
  const [rate, setRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setRate(0);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "users", uid),
      (snap) => {
        const data = snap.data();
        setRate(typeof data?.defaultRate === "number" ? data.defaultRate : 0);
        setLoading(false);
      },
      () => {
        setRate(0);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { rate, loading };
}

export async function setRate(uid: string, rate: number): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "users", uid),
    { defaultRate: rate },
    { merge: true }
  );
}
