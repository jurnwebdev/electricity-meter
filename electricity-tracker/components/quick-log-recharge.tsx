"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEntry, defaultEntryDate } from "@/lib/firebase/entries";
import { computeCost } from "@/lib/calculations";
import { formatNaira } from "@/lib/format";

type Props = {
  uid: string;
  rate: number;
};

export function QuickLogRecharge({ uid, rate }: Props) {
  const [units, setUnits] = useState("");
  const [cost, setCost] = useState("");
  const [costDirty, setCostDirty] = useState(false);
  const [entryDate, setEntryDate] = useState(defaultEntryDate());
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (costDirty) {
      return;
    }
    const u = Number.parseFloat(units);
    if (Number.isFinite(u) && u > 0 && rate > 0) {
      setCost(computeCost(u, rate, null).toFixed(2));
    } else if (units === "") {
      setCost("");
    }
  }, [units, rate, costDirty]);

  function reset() {
    setUnits("");
    setCost("");
    setCostDirty(false);
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
    const typedCost = cost.trim() === "" ? null : Number.parseFloat(cost);
    const finalCost = computeCost(u, rate, typedCost);
    setSubmitting(true);
    try {
      await createEntry(uid, {
        type: "recharge",
        units: u,
        costNgn: finalCost,
        ratePerKwh: rate,
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
        <h3 className="text-base font-semibold">Log recharge</h3>
        <p className="text-sm text-muted-foreground">
          {rate > 0
            ? `Cost auto-calculated at ${formatNaira(rate)}/kWh.`
            : "Set a rate in Settings to auto-calculate cost."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recharge-units">Units (kWh)</Label>
          <Input
            id="recharge-units"
            type="number"
            step="0.01"
            min="0"
            required
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="e.g. 50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recharge-cost">Cost (₦)</Label>
          <Input
            id="recharge-cost"
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => {
              setCost(e.target.value);
              setCostDirty(true);
            }}
            placeholder={rate > 0 ? "auto" : "0.00"}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recharge-date">Date</Label>
          <Input
            id="recharge-date"
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recharge-note">Note (optional)</Label>
          <Input
            id="recharge-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. November top-up"
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">Recharge logged.</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Log recharge"}
      </Button>
    </form>
  );
}
