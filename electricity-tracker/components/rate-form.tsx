"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setRate } from "@/lib/firebase/settings";
import { formatNaira } from "@/lib/format";

type Props = {
  uid: string;
  rate: number;
};

export function RateForm({ uid, rate }: Props) {
  const [value, setValue] = useState(rate.toString());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setMessage({ kind: "err", text: "Rate must be a non-negative number." });
      return;
    }
    setSaving(true);
    try {
      await setRate(uid, parsed);
      setMessage({ kind: "ok", text: "Saved." });
    } catch {
      setMessage({ kind: "err", text: "Could not save. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default recharge rate</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Used to auto-calculate cost when logging a recharge. Leave at 0 to enter cost manually.
            Current rate: <span className="font-medium text-foreground">{formatNaira(rate)}/kWh</span>.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48 space-y-1.5">
              <Label htmlFor="rate">Rate (₦/kWh)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
          {message && (
            <p
              className={
                message.kind === "ok"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
