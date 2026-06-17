const NAIRA = "₦";

const numberFormatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

export function formatNaira(value: number): string {
  if (!Number.isFinite(value)) {
    return `${NAIRA}0.00`;
  }
  return `${NAIRA}${numberFormatter.format(value)}`;
}

export function formatUnits(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  return numberFormatter.format(value);
}

export function formatSignedUnits(value: number): string {
  if (!Number.isFinite(value)) {
    return "0.00";
  }
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${numberFormatter.format(Math.abs(value))}`;
}

export function formatInteger(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return integerFormatter.format(value);
}

export function formatRate(value: number): string {
  return `${formatNaira(value)}/kWh`;
}

export function formatDateTime(dateKey: string, createdAt: number): string {
  const d = new Date(createdAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dateKey} ${hh}:${mm}`;
}

export function formatDateLabel(dateKey: string): string {
  return dateKey;
}