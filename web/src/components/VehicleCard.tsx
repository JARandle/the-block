import { useState } from "react";
import { Link } from "react-router-dom";
import type { Vehicle } from "../types/vehicle";
import { auctionCountdownLabel, calcProfit, calcProfitMargin, formatCurrency, formatDateTime } from "../lib/format";
import { useWatchlistContext } from "../context/WatchlistContext";

/**
 * Derives the Tailwind colour classes for the profit value based on the
 * profit margin percentage.
 *
 * - 15 % or more below retail → green  (strong buying opportunity)
 * - 1 – 14 % below retail     → amber  (modest margin)
 * - At or above retail price  → red    (bid exceeds retail value)
 *
 * @param margin - Profit margin as a fraction (e.g. `0.20` = 20 %). Pass
 *                 `null` when no buy-now price is available.
 * @returns A Tailwind text-colour class string.
 */
function profitColour(margin: number | null): string {
  if (margin == null) return "text-slate-400";
  if (margin >= 0.15) return "text-emerald-400";
  if (margin > 0) return "text-amber-300";
  return "text-red-400";
}

/**
 * Summary card for a single vehicle, used in the inventory grid. Displays the
 * thumbnail image, year/make/model, location, current bid, and auction
 * countdown. Includes a toggle button for adding or removing the vehicle from
 * the user's watchlist.
 *
 * When the listing has a buy-now price set, an "Est. profit" toggle becomes
 * available. Activating it reveals the dealer's retail asking price, the
 * estimated profit (retail minus current bid), and the corresponding margin
 * percentage — colour-coded green, amber, or red based on margin depth.
 *
 * @param vehicle  - The vehicle data to display.
 * @param priority - When `true`, the thumbnail image is loaded eagerly and
 *                   decoded synchronously (for above-the-fold cards).
 */
export function VehicleCard({ vehicle, priority = false }: { vehicle: Vehicle; priority?: boolean }) {
  const { has, toggle } = useWatchlistContext();
  const saved = has(vehicle.id);
  const thumb = vehicle.images[0];

  const [showProfit, setShowProfit] = useState(false);
  const profit = calcProfit(vehicle.buy_now_price, vehicle.current_bid);
  const margin = calcProfitMargin(vehicle.buy_now_price, vehicle.current_bid);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-lg shadow-black/20 transition hover:border-slate-600 hover:bg-slate-900">
      <div className="relative">
        <Link
          to={`/vehicle/${vehicle.id}`}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-inset rounded-t-2xl"
        >
          <div className="aspect-[16/10] overflow-hidden bg-slate-800">
            {thumb ? (
              <img
                src={thumb}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : "auto"}
                width={800}
                height={500}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                No photo
              </div>
            )}
          </div>
        </Link>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggle(vehicle.id);
          }}
          className={`absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-3 text-sm font-medium shadow-lg backdrop-blur-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 ${
            saved
              ? "border-amber-400/60 bg-amber-500/20 text-amber-200"
              : "border-slate-600/80 bg-slate-950/70 text-slate-200 hover:bg-slate-900/90"
          }`}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save vehicle"}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h2 className="font-display text-base font-semibold text-white leading-snug">
            <Link
              to={`/vehicle/${vehicle.id}`}
              className="hover:text-amber-200 focus:outline-none focus-visible:text-amber-200"
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Link>
          </h2>
          <p className="text-sm text-slate-400">{vehicle.trim}</p>
        </div>
        <p className="text-sm text-slate-500">
          {vehicle.city}, {vehicle.province} · Lot {vehicle.lot}
        </p>
        <div className="mt-auto flex flex-col gap-2 border-t border-slate-800 pt-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Current bid</p>
              <p className="text-lg font-semibold tabular-nums text-amber-300">
                {formatCurrency(vehicle.current_bid)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 tabular-nums">
                {formatDateTime(vehicle.auction_start)}
              </p>
              <p className="text-xs text-slate-500">{auctionCountdownLabel(vehicle.auction_start)}</p>
            </div>
          </div>

          {profit != null && (
            <button
              type="button"
              onClick={() => setShowProfit((v) => !v)}
              className="self-start rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              aria-expanded={showProfit}
              aria-label={showProfit ? "Hide estimated profit" : "Show estimated profit"}
            >
              {showProfit ? "Hide profit ▲" : "Est. profit ▼"}
            </button>
          )}

          {showProfit && profit != null && vehicle.buy_now_price != null && (
            <div className="rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Retail ask</span>
                <span className="tabular-nums text-slate-200">{formatCurrency(vehicle.buy_now_price)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-4">
                <span className="text-slate-400">Est. profit</span>
                <span className={`tabular-nums font-semibold ${profitColour(margin)}`}>
                  {profit >= 0 ? "+" : "−"}{formatCurrency(Math.abs(profit))}
                  {margin != null && (
                    <span className="ml-1 font-normal opacity-75">
                      ({Math.abs(Math.round(margin * 100))}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
