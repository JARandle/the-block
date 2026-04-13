import { useEffect, useId, useState } from "react";
import type { Vehicle } from "../types/vehicle";
import { formatCurrency } from "../lib/format";
import { nextMinimumBid } from "../lib/bid";
import { useVehiclesContext } from "../context/VehiclesContext";

export function BidPanel({ vehicle }: { vehicle: Vehicle }) {
  const { placeBid } = useVehiclesContext();
  const min = nextMinimumBid(vehicle);
  const inputId = useId();
  const [value, setValue] = useState(String(min));
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  useEffect(() => {
    setValue(String(nextMinimumBid(vehicle)));
  }, [
    vehicle.id,
    vehicle.current_bid,
    vehicle.bid_count,
    vehicle.starting_bid,
  ]);

  const amount = Number.parseFloat(value.replace(/,/g, ""));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const result = placeBid(vehicle.id, amount);
    if (result.ok) {
      setMessage({ type: "ok", text: "Your bid was recorded." });
    } else {
      setMessage({ type: "err", text: result.message });
    }
  }

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
      aria-labelledby="bid-heading"
    >
      <h2 id="bid-heading" className="font-display text-lg font-semibold text-white">
        Place a bid
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Minimum next bid:{" "}
        <span className="font-medium text-slate-200 tabular-nums">
          {formatCurrency(min)}
        </span>
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Current bid</dt>
          <dd className="font-semibold tabular-nums text-amber-300">
            {formatCurrency(vehicle.current_bid)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Bids</dt>
          <dd className="font-semibold tabular-nums text-white">{vehicle.bid_count}</dd>
        </div>
      </dl>
      <form noValidate onSubmit={onSubmit} className="mt-5 space-y-3">
        <div>
          <label htmlFor={inputId} className="sr-only">
            Your bid amount in CAD
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={min}
              step={1}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white tabular-nums placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
            />
            <button
              type="submit"
              className="min-h-[48px] shrink-0 rounded-xl bg-amber-500 px-6 text-base font-semibold text-slate-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Submit bid
            </button>
          </div>
        </div>
        {message ? (
          <p
            role="status"
            className={
              message.type === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"
            }
          >
            {message.text}
          </p>
        ) : null}
      </form>
      <p className="mt-4 text-xs text-slate-500">
        Prototype: bids are stored in this browser only (localStorage). No account required.
      </p>
    </section>
  );
}
