export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function auctionCountdownLabel(auctionStartIso: string, now: Date = new Date()): string {
  const start = new Date(auctionStartIso).getTime();
  const diff = start - now.getTime();
  if (diff <= 0) return "Auction in progress";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 48) return `Starts in ${Math.ceil(diff / 86_400_000)} days`;
  if (h >= 1) return `Starts in ${h}h ${m}m`;
  if (m >= 1) return `Starts in ${m} min`;
  return "Starting soon";
}
