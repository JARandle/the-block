import { useMemo, useState } from "react";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useWatchlistContext } from "../context/WatchlistContext";
import { VehicleCard } from "../components/VehicleCard";
import { SkeletonCard } from "../components/SkeletonCard";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { matchesSearch, sortVehicles, type SortKey } from "../lib/search";

export function InventoryPage() {
  const { mergedVehicles, loading, error } = useVehiclesContext();
  const { ids: watchlist } = useWatchlistContext();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [sort, setSort] = useState<SortKey>("auction_start");
  const [savedOnly, setSavedOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = mergedVehicles;
    if (savedOnly) list = list.filter((v) => watchlist.has(v.id));
    const q = list.filter((v) => matchesSearch(v, debouncedQuery));
    return sortVehicles(q, sort);
  }, [mergedVehicles, debouncedQuery, sort, savedOnly, watchlist]);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div
          className="rounded-2xl border border-red-900/50 bg-red-950/30 p-6 text-red-200"
          role="alert"
        >
          <p className="font-medium">Could not load inventory</p>
          <p className="mt-2 text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Vehicle auctions
        </h1>
        <p className="mt-2 text-slate-400">
          Search by make, model, VIN, lot, location, or dealership. Open a listing for full
          specs and bidding.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full sm:max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-slate-300">
            Search
          </label>
          <input
            id="search"
            type="search"
            placeholder="e.g. Mazda, Toronto, A-0001…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white placeholder:text-slate-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:w-auto">
            <label htmlFor="sort" className="block text-sm font-medium text-slate-300">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40 sm:min-w-[200px]"
            >
              <option value="auction_start">Auction start (soonest)</option>
              <option value="current_bid_desc">Current bid (high to low)</option>
              <option value="year_desc">Year (newest)</option>
              <option value="relevance">Listing order</option>
            </select>
          </div>
          <div className="flex min-h-[48px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 sm:py-0">
            <input
              id="saved-only"
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
              className="h-5 w-5 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-400/40"
            />
            <label htmlFor="saved-only" className="text-sm text-slate-300 cursor-pointer">
              Saved only ({watchlist.size})
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-16 text-center text-slate-500" role="status">
          No vehicles match your search. Try a broader term.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-slate-500">
            Showing {filtered.length} of {mergedVehicles.length} vehicles
          </p>
          <ul className="mt-6 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <li key={v.id}>
                <VehicleCard vehicle={v} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
