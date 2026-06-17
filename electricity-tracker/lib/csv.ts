import type { Entry } from "./types";

const COLUMNS = [
  "id",
  "type",
  "units",
  "cost_ngn",
  "rate_per_kwh",
  "note",
  "entry_date",
  "created_at",
] as const;

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function entriesToCsv(entries: Entry[]): string {
  const rows: string[] = [COLUMNS.join(",")];
  for (const e of entries) {
    const createdAtIso = new Date(e.createdAt).toISOString();
    const cells = [
      e.id,
      e.type,
      e.units.toFixed(2),
      e.costNgn.toFixed(2),
      e.ratePerKwh.toFixed(2),
      e.note ?? "",
      e.entryDate,
      createdAtIso,
    ].map(String).map(escapeField);
    rows.push(cells.join(","));
  }
  return rows.join("\r\n") + "\r\n";
}

export function downloadCsv(entries: Entry[]): void {
  const csv = entriesToCsv(entries);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `electricity-history-${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
