"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventType } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const TYPE_OPTIONS: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "checkin", label: "Check-in" },
  { value: "recharge", label: "Recharge" },
  { value: "physical_meter", label: "Meter read" },
  { value: "box_reading", label: "Box read" },
  { value: "onboarding", label: "Onboarding" },
  { value: "baseline_adjusted", label: "Baseline" },
];

export function HistoryFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const type = (params.get("type") as EventType | "all" | null) ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const hasDate = Boolean(from || to);
  const advanced = hasDate;

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
    <div className="rounded-xl border border-border/60 bg-card shadow-card">
      <div className="flex flex-wrap items-end gap-3 p-3 sm:p-4">
        <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-[14rem]">
          <Label htmlFor="filter-type" className="text-xs">
            Type
          </Label>
          <Select value={type} onValueChange={(v) => update({ type: v })}>
            <SelectTrigger id="filter-type" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (advanced) {
                update({ from: "", to: "" });
              }
            }}
            className="h-10"
          >
            {advanced ? "Clear dates" : "Date range"}
          </Button>
          {(advanced || type !== "all") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-10"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
      {advanced ? (
        <div className="grid grid-cols-2 gap-3 border-t border-border/60 px-3 py-3 sm:px-4 sm:py-4">
          <div className="space-y-1.5">
            <Label htmlFor="filter-from" className="text-xs">
              From
            </Label>
            <Input
              id="filter-from"
              type="date"
              value={from}
              onChange={(e) => update({ from: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-to" className="text-xs">
              To
            </Label>
            <Input
              id="filter-to"
              type="date"
              value={to}
              onChange={(e) => update({ to: e.target.value })}
              className="h-10"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}