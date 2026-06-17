"use client";

import { cn } from "@/lib/utils";
import type { EventType } from "@/lib/types";

const LABEL: Record<EventType, string> = {
  onboarding: "Onboarding",
  checkin: "Check-in",
  recharge: "Recharge",
  physical_meter: "Meter read",
  box_reading: "Box read",
  baseline_adjusted: "Baseline",
};

const STYLES: Record<EventType, string> = {
  onboarding:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  checkin:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  recharge:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  physical_meter:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  box_reading:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  baseline_adjusted:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export function EventTypeBadge({
  type,
  className,
}: {
  type: EventType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[type],
        className
      )}
    >
      {LABEL[type]}
    </span>
  );
}
