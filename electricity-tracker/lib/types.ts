export type EntryType = "recharge" | "usage";

export type Entry = {
  id: string;
  type: EntryType;
  units: number;
  costNgn: number;
  ratePerKwh: number;
  note: string | null;
  entryDate: string;
  createdAt: number;
};
