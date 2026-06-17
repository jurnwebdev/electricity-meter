"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntry, defaultEntryDate } from "@/lib/firebase/entries";

type Props = {
  uid: string;
};

export function QuickLogUsage({ uid }: Props) {
  const [units, setUnits] = useState("");
  const [entryDate, setEntryDate] = useState(defaultEntryDate());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setUnits("");
    setEntryDate(defaultEntryDate());
    setNote("");
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const u = Number.parseFloat(units);
    if (!Number.isFinite(u) || u <= 0) {
      setError("Units must be greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await createEntry(uid, {
        type: "usage",
        units: u,
        costNgn: 0,
        ratePerKwh: 0,
        note: note.trim() === "" ? null : note.trim(),
        entryDate,
      });
      reset();
      setSuccess(true);
    } catch (err) {
      setError("Could not save. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Log usage</h3>
        <p className="text-sm text-muted-foreground">Record units consumed.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="usage-units">Units (kWh)</Label>
          <Input
            id="usage-units"
            type="number"
            step="0.01"
            min="0"
            required
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="e.g. 10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="usage-date">Date</Label>
          <Input
            id="usage-date"
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="usage-note">Note (optional)</Label>
        <Input
          id="usage-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. AC heavy day"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Usage logged.</p>}
      <Button type="submit" variant="secondary" disabled={submitting}>
        {submitting ? "Saving…" : "Log usage"}
      </Button>
    </form>
  );
}
