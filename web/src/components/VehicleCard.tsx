import { Link } from "react-router-dom";
import type { Vehicle } from "../types/vehicle";
import { auctionCountdownLabel, formatCurrency } from "../lib/format";
import { useWatchlistContext } from "../context/WatchlistContext";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { has, toggle } = useWatchlistContext();
  const saved = has(vehicle.id);
  const thumb = vehicle.images[0];
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
                alt=""
                loading="lazy"
                decoding="async"
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
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-slate-800 pt-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Current bid</p>
            <p className="text-lg font-semibold tabular-nums text-amber-300">
              {formatCurrency(vehicle.current_bid)}
            </p>
          </div>
          <p className="text-xs text-slate-500">{auctionCountdownLabel(vehicle.auction_start)}</p>
        </div>
      </div>
    </article>
  );
}
