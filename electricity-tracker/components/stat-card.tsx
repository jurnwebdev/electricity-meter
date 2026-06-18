import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "good" | "warn" | "bad" | "neutral";

const toneClass: Record<Tone, string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-rose-600 dark:text-rose-400",
  neutral: "text-foreground",
};

const toneDot: Record<Tone, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  neutral: "bg-muted-foreground/40",
};

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
};

export function StatCard({ label, value, hint, tone = "neutral", icon, className }: Props) {
  return (
    <Card size="sm" className={cn("shadow-card", className)}>
      <CardContent className="flex flex-col gap-1.5 py-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/70">
          {icon ? <span aria-hidden className="text-foreground/70">{icon}</span> : null}
          <span>{label}</span>
        </div>
        <div className={cn("text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.7rem]", tone !== "neutral" && toneClass[tone])}>
          {value}
        </div>
        {hint ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/65">
            <span className={cn("size-1.5 rounded-full", toneDot[tone])} aria-hidden />
            <span>{hint}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}