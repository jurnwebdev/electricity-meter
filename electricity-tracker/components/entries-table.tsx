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
import { Button } from "@/components/ui/button";
import { formatNaira, formatUnits } from "@/lib/format";
import type { Entry } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  entries: Entry[];
  showEdit?: boolean;
  onDelete?: (id: string) => void;
};

export function EntriesTable({ entries, showEdit = true, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No entries match the current filters.
      </div>
    );
  }

  const totalUnits = entries.reduce((sum, e) => sum + e.units, 0);
  const totalCost = entries
    .filter((e) => e.type === "recharge")
    .reduce((sum, e) => sum + e.costNgn, 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Units</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="text-right">Rate</TableHead>
            <TableHead>Note</TableHead>
            {showEdit && <TableHead className="w-32 text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
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
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {e.ratePerKwh > 0 ? formatNaira(e.ratePerKwh) : "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {e.note ?? "—"}
              </TableCell>
              {showEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/settings/edit/${e.id}`}>Edit</Link>
                    </Button>
                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this entry?")) {
                            onDelete(e.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          <TableRow>
            <TableCell colSpan={2} className="font-medium">Totals</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatUnits(totalUnits)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{formatNaira(totalCost)}</TableCell>
            <TableCell colSpan={showEdit ? 3 : 2} />
          </TableRow>
        </tfoot>
      </Table>
    </div>
  );
}
