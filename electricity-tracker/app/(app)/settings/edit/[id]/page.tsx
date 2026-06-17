"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/auth";
import { useEvents, updateEventFields } from "@/lib/firebase/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeRate, reduceEvents } from "@/lib/calculations";
import { today } from "@/lib/date";
import { formatNaira, formatRate, formatUnits } from "@/lib/format";
import { driftKwh } from "@/lib/calculations";
import type { Event } from "@/lib/types";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuthUser();
  const router = useRouter();
  const { events } = useEvents(user?.uid ?? null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [units, setUnits] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [physicalReading, setPhysicalReading] = useState("");
  const [physicalNote, setPhysicalNote] = useState("");
  const [physicalDate, setPhysicalDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { id } = await params;
      if (!user) {
        return;
      }
      try {
        const snap = await getDoc(doc(getFirebaseDb(), "users", user.uid, "events", id));
        if (cancelled) {
          return;
        }
        if (!snap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = snap.data();
        const type = data.type;
        if (type !== "recharge" && type !== "physical_meter") {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (type === "recharge") {
          setUnits(String(data.units ?? ""));
          setCost(String(data.costNgn ?? ""));
          setNote((data.note as string) ?? "");
          setEntryDate(String(data.date ?? today()));
        } else {
          setPhysicalReading(String(data.creditMeterReading ?? ""));
          setPhysicalNote((data.note as string) ?? "");
          setPhysicalDate(String(data.date ?? today()));
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params, user]);

  const state = events.length > 0 ? reduceEvents(events) : null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !event) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (event.type === "recharge") {
        const u = Number.parseFloat(units);
        const c = Number.parseFloat(cost);
        if (!Number.isFinite(u) || u <= 0 || !Number.isFinite(c) || c <= 0) {
          setError("Units and cost must be greater than zero.");
          setSaving(false);
          return;
        }
        if (!state) {
          setError("State not loaded yet.");
          setSaving(false);
          return;
        }
        await updateEventFields(user.uid, event.id ?? "", {
          units: u,
          costNgn: c,
          ratePerKwh: computeRate(u, c),
          note: note.trim() === "" ? null : note.trim(),
          date: entryDate,
          newAppUnitsRemaining: state.appUnitsRemaining + u,
        });
      } else {
        const r = Number.parseFloat(physicalReading);
        if (!Number.isFinite(r) || r < 0) {
          setError("Reading must be zero or greater.");
          setSaving(false);
          return;
        }
        if (!state) {
          setError("State not loaded yet.");
          setSaving(false);
          return;
        }
        await updateEventFields(user.uid, event.id ?? "", {
          creditMeterReading: r,
          driftKwh: driftKwh(state, r),
          note: physicalNote.trim() === "" ? null : physicalNote.trim(),
          date: physicalDate,
        });
      }
      router.push("/settings");
    } catch (err) {
      console.error(err);
      setError("Could not save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (notFound || !event) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Event not found or not editable.
        </p>
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          ← Back to settings
        </button>
      </div>
    );
  }

  const u = Number.parseFloat(units);
  const c = Number.parseFloat(cost);
  const rate =
    Number.isFinite(u) && u > 0 && Number.isFinite(c) && c > 0 ? computeRate(u, c) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit {event.type === "recharge" ? "recharge" : "meter reading"}</h1>
        <p className="text-sm text-muted-foreground">
          {event.type === "recharge"
            ? "Update units and cost. Rate is re-derived."
            : "Update the physical credit meter reading."}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {event.type === "recharge" ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-units">Units (kWh)</Label>
                    <Input
                      id="edit-units"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={units}
                      onChange={(e) => setUnits(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-cost">Cost (₦)</Label>
                    <Input
                      id="edit-cost"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-date">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      required
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-note">Note (optional)</Label>
                    <Input
                      id="edit-note"
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-mono tabular-nums">{formatRate(rate)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-reading">Reading (kWh)</Label>
                    <Input
                      id="edit-reading"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={physicalReading}
                      onChange={(e) => setPhysicalReading(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-physical-date">Date</Label>
                    <Input
                      id="edit-physical-date"
                      type="date"
                      required
                      value={physicalDate}
                      onChange={(e) => setPhysicalDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-physical-note">Note (optional)</Label>
                  <Input
                    id="edit-physical-note"
                    type="text"
                    value={physicalNote}
                    onChange={(e) => setPhysicalNote(e.target.value)}
                  />
                </div>
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/settings")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
