"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNaira, formatUnits } from "@/lib/format";
import type { Entry } from "@/lib/types";
import { compareDateKeys } from "@/lib/date";
import { cn } from "@/lib/utils";

type Props = {
  entries: Entry[];
};

export function RecentActivity({ entries }: Props) {
  const sorted = [...entries]
    .sort((a, b) => {
      const byDate = compareDateKeys(b.entryDate, a.entryDate);
      if (byDate !== 0) {
        return byDate;
      }
      return b.createdAt - a.createdAt;
    })
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No activity yet. Log your first recharge or usage above.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold">Recent activity</h3>
        <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground">
          View all →
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Units</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-mono text-xs">{e.entryDate}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    e.type === "recharge"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  )}
                >
                  {e.type}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatUnits(e.units)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {e.type === "recharge" ? formatNaira(e.costNgn) : "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {e.note ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
