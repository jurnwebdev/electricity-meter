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
import type { Entry, EntryType } from "../types";

type EntryDoc = {
  type: EntryType;
  units: number;
  costNgn: number;
  ratePerKwh: number;
  note: string | null;
  entryDate: string;
  createdAt: { toMillis(): number } | null;
};

function fromDoc(id: string, data: EntryDoc): Entry {
  return {
    id,
    type: data.type,
    units: data.units,
    costNgn: data.costNgn,
    ratePerKwh: data.ratePerKwh,
    note: data.note,
    entryDate: data.entryDate,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
  };
}

export function useEntries(uid: string | null): { entries: Entry[]; loading: boolean } {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(getFirebaseDb(), "users", uid, "entries"),
      orderBy("entryDate", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => fromDoc(d.id, d.data() as EntryDoc)));
        setLoading(false);
      },
      () => {
        setEntries([]);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { entries, loading };
}

export type CreateEntryInput = {
  type: EntryType;
  units: number;
  costNgn: number;
  ratePerKwh: number;
  note: string | null;
  entryDate: string;
};

export async function createEntry(uid: string, input: CreateEntryInput): Promise<void> {
  await addDoc(collection(getFirebaseDb(), "users", uid, "entries"), {
    type: input.type,
    units: input.units,
    costNgn: input.costNgn,
    ratePerKwh: input.ratePerKwh,
    note: input.note,
    entryDate: input.entryDate,
    createdAt: serverTimestamp(),
  });
}

export type UpdateEntryInput = {
  type: EntryType;
  units: number;
  costNgn: number;
  note: string | null;
  entryDate: string;
};

export async function updateEntry(
  uid: string,
  entryId: string,
  input: UpdateEntryInput
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "users", uid, "entries", entryId), {
    type: input.type,
    units: input.units,
    costNgn: input.costNgn,
    note: input.note,
    entryDate: input.entryDate,
  });
}

export async function deleteEntry(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), "users", uid, "entries", entryId));
}

export function defaultEntryDate(): string {
  return today();
}

export { where };
