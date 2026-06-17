"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HistoryFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const type = params.get("type") ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const update = useCallback(
    (next: Partial<{ type: string; from: string; to: string }>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v && v !== "all" && v !== "") {
          sp.set(k, v);
        } else {
          sp.delete(k);
        }
      }
      router.push(`/history?${sp.toString()}`);
    },
    [params, router]
  );

  function reset() {
    router.push("/history");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="filter-type">Type</Label>
          <Select value={type} onValueChange={(v) => update({ type: v })}>
            <SelectTrigger id="filter-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="recharge">Recharge</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-from">From</Label>
          <Input
            id="filter-from"
            type="date"
            value={from}
            onChange={(e) => update({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-to">To</Label>
          <Input
            id="filter-to"
            type="date"
            value={to}
            onChange={(e) => update({ to: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={reset} className="w-full">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
