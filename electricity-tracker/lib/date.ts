const MS_PER_DAY = 86_400_000;

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toDateKey(new Date());
}

export function monthStart(now: Date = new Date()): string {
  return toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function daysAgoKey(days: number, now: Date = new Date()): string {
  return toDateKey(new Date(now.getTime() - days * MS_PER_DAY));
}

export function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
