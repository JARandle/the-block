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

/**
 * Calculates the estimated profit between a live market price and the current
 * bid. A positive result means the vehicle can be acquired below market; a
 * negative result means the bid has exceeded the market average.
 *
 * Returns `null` when no market price is available (e.g. the API has not been
 * called yet, is loading, or returned no data for the VIN).
 *
 * @param marketPrice - The live market average price in CAD, or `null`.
 * @param currentBid  - The current highest bid amount in CAD.
 * @returns The estimated profit in CAD, or `null` if unavailable.
 */
export function calcProfit(marketPrice: number | null, currentBid: number): number | null {
  if (marketPrice == null) return null;
  return marketPrice - currentBid;
}

/**
 * Calculates the profit as a percentage of the market price, expressed as a
 * value between -1 and 1 (e.g. `0.25` = 25 % below market average).
 *
 * Returns `null` when no market price is available or when the market price is
 * zero to avoid division by zero.
 *
 * @param marketPrice - The live market average price in CAD, or `null`.
 * @param currentBid  - The current highest bid amount in CAD.
 * @returns The profit margin as a fraction, or `null` if unavailable.
 */
export function calcProfitMargin(marketPrice: number | null, currentBid: number): number | null {
  if (marketPrice == null || marketPrice === 0) return null;
  return (marketPrice - currentBid) / marketPrice;
}

/**
 * Margin at or above which a profit value is considered a strong buying
 * opportunity (15 % or more below market average).
 */
export const STRONG_MARGIN_THRESHOLD = 0.15;

/**
 * Returns the Tailwind text-colour class that should be applied to a displayed
 * profit value based on the margin percentage.
 *
 * - `>= STRONG_MARGIN_THRESHOLD` (≥ 15 %) → green  (strong buying opportunity)
 * - `> 0` and `< STRONG_MARGIN_THRESHOLD`  → amber  (modest margin)
 * - `<= 0`                                  → red    (bid at or above market)
 * - `null`                                  → muted  (no market price yet)
 *
 * @param margin - Profit margin as a fraction from {@link calcProfitMargin},
 *                 or `null` when the market price is unavailable.
 * @returns A Tailwind text-colour class string.
 */
export function profitColour(margin: number | null): string {
  if (margin == null) return "text-slate-400";
  if (margin >= STRONG_MARGIN_THRESHOLD) return "text-emerald-400";
  if (margin > 0) return "text-amber-300";
  return "text-red-400";
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
