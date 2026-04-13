/**
 * Formats a numeric amount as a Canadian dollar currency string with no
 * fractional digits (e.g. `$12,500`).
 *
 * @param amount - The monetary value to format.
 * @returns A locale-formatted CAD currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO 8601 date-time string into a human-readable Canadian locale
 * date and time (e.g. `Apr 14, 2026, 2:00 p.m.`).
 *
 * @param iso - An ISO 8601 date-time string.
 * @returns A locale-formatted date and time string.
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/**
 * Returns a human-readable countdown label for when an auction starts relative
 * to a given reference time.
 *
 * - `"Auction in progress"` — start time is in the past.
 * - `"Starts in N days"`    — more than 48 hours away.
 * - `"Starts in Xh Ym"`    — between 1 hour and 48 hours away.
 * - `"Starts in N min"`     — less than 1 hour but at least 1 minute away.
 * - `"Starting soon"`       — less than 1 minute away.
 *
 * @param auctionStartIso - ISO 8601 string for the auction start time.
 * @param now             - Reference timestamp; defaults to the current time.
 * @returns A display-ready countdown string.
 */
export function auctionCountdownLabel(auctionStartIso: string, now: Date = new Date()): string {
  const diff = new Date(auctionStartIso).getTime() - now.getTime();
  if (diff <= 0) return "Auction in progress";
  const h = Math.floor(diff / MS_PER_HOUR);
  const m = Math.floor((diff % MS_PER_HOUR) / MS_PER_MINUTE);
  if (h >= 48) return `Starts in ${Math.ceil(diff / MS_PER_DAY)} days`;
  if (h >= 1) return `Starts in ${h}h ${m}m`;
  if (m >= 1) return `Starts in ${m} min`;
  return "Starting soon";
}
