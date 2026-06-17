"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateEntry } from "@/lib/firebase/entries";
import type { Entry, EntryType } from "@/lib/types";

type Props = {
  uid: string;
  entry: Entry;
};

export function EditEntryForm({ uid, entry }: Props) {
  const router = useRouter();
  const [type, setType] = useState<EntryType>(entry.type);
  const [units, setUnits] = useState(entry.units.toString());
  const [cost, setCost] = useState(entry.costNgn.toString());
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [note, setNote] = useState(entry.note ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const u = Number.parseFloat(units);
    if (!Number.isFinite(u) || u <= 0) {
      setError("Units must be greater than zero.");
      return;
    }
    if (type !== "recharge" && type !== "usage") {
      setError("Type must be recharge or usage.");
      return;
    }
    const c = cost.trim() === "" ? 0 : Number.parseFloat(cost);
    if (!Number.isFinite(c) || c < 0) {
      setError("Cost must be a non-negative number.");
      return;
    }
    setSaving(true);
    try {
      await updateEntry(uid, entry.id, {
        type,
        units: u,
        costNgn: c,
        note: note.trim() === "" ? null : note.trim(),
        entryDate,
      });
      router.push("/settings");
    } catch (err) {
      console.error(err);
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Editing this entry preserves the original rate of{" "}
            {entry.ratePerKwh > 0 ? `${entry.ratePerKwh.toFixed(2)} ₦/kWh` : "0 ₦/kWh"} at the time it was logged.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as EntryType)}>
                <SelectTrigger id="edit-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recharge">Recharge</SelectItem>
                  <SelectItem value="usage">Usage</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
  );
}
