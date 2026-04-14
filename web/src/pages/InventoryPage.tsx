import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useWatchlistContext } from "../context/WatchlistContext";
import { VehicleCard } from "../components/VehicleCard";
import { SkeletonCard } from "../components/SkeletonCard";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  buildVehicleFilterIndex,
  filterAndSortInventory,
} from "../lib/inventoryFilters";
import type { SortKey } from "../lib/search";

const PAGE_SIZE = 12;

/**
 * Number of skeleton cards shown while the inventory is loading. Half of
 * PAGE_SIZE fills one row on mobile and part of the first page on larger
 * screens, keeping the perceived layout stable without over-rendering.
 */
const SKELETON_COUNT = PAGE_SIZE / 2;

const selectClass =
  "mt-1 min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40";

/**
 * Full-page vehicle inventory listing with search, filter, and sort controls.
 *
 * - Free-text search is debounced (200 ms) to avoid filtering on every
 *   keystroke.
 * - Dropdown filters are built from the actual inventory data via
 *   {@link buildVehicleFilterIndex}; the Model dropdown is disabled until a
 *   Make is selected.
 * - When the Make filter changes the Model filter is automatically cleared if
 *   the current model no longer belongs to the selected make.
 * - Shows skeleton cards while the inventory is loading, and an empty-state
 *   message when no vehicles match the active filters.
 */
export function InventoryPage() {
  const { mergedVehicles, loading, error } = useVehiclesContext();
  const { ids: watchlist } = useWatchlistContext();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 200);
  const [sort, setSort] = useState<SortKey>("auction_start");
  const [savedOnly, setSavedOnly] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [makeFilter, setMakeFilter] = useState<string | null>(null);
  const [modelFilter, setModelFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLButtonElement>(null);

  const filterIndex = useMemo(
    () => buildVehicleFilterIndex(mergedVehicles),
    [mergedVehicles],
  );
  const { yearOptions, makeOptions, modelsForMake } = filterIndex;

  const modelOptions = useMemo(
    () =>
      makeFilter === null ? [] : (modelsForMake.get(makeFilter) ?? []),
    [makeFilter, modelsForMake],
  );

  useEffect(() => {
    if (makeFilter === null) {
      setModelFilter((prev) => (prev === null ? prev : null));
      return;
    }
    const allowed = modelsForMake.get(makeFilter);
    if (
      modelFilter !== null &&
      (!allowed || !allowed.includes(modelFilter))
    ) {
      setModelFilter(null);
    }
  }, [makeFilter, modelFilter, modelsForMake]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, sort, savedOnly, yearFilter, makeFilter, modelFilter]);

  /**
   * Increases the number of visible vehicles by {@link PAGE_SIZE} and returns
   * keyboard focus to the "Load more" button on the next animation frame so
   * keyboard and assistive-technology users maintain their position in the
   * list without the page scrolling.
   */
  const loadMore = useCallback(() => {
    setVisibleCount((n) => n + PAGE_SIZE);
    requestAnimationFrame(() => loadMoreRef.current?.focus({ preventScroll: true }));
  }, []);

  const filtered = useMemo(
    () =>
      filterAndSortInventory(mergedVehicles, {
        savedOnly,
        isWatchlisted: (id) => watchlist.has(id),
        year: yearFilter,
        make: makeFilter,
        model: modelFilter,
        query: debouncedQuery,
        sort,
        searchBlobs: filterIndex.searchBlobs,
      }),
    [
      mergedVehicles,
      debouncedQuery,
      sort,
      savedOnly,
      watchlist,
      yearFilter,
      makeFilter,
      modelFilter,
      filterIndex.searchBlobs,
    ],
  );

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
            className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white placeholder:text-slate-400 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full sm:w-auto">
            <label htmlFor="filter-year" className="block text-sm font-medium text-slate-300">
              Year
            </label>
            <select
              id="filter-year"
              value={yearFilter === null ? "" : String(yearFilter)}
              onChange={(e) => {
                const v = e.target.value;
                setYearFilter(v === "" ? null : Number(v));
              }}
              className={`${selectClass} sm:min-w-[140px]`}
            >
              <option value="">Any year</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="filter-make" className="block text-sm font-medium text-slate-300">
              Make
            </label>
            <select
              id="filter-make"
              value={makeFilter ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setMakeFilter(v === "" ? null : v);
                setModelFilter(null);
              }}
              className={`${selectClass} sm:min-w-[180px]`}
            >
              <option value="">Any make</option>
              {makeOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="filter-model" className="block text-sm font-medium text-slate-300">
              Model
              {makeFilter === null ? (
                <span className="ml-1 font-normal text-slate-500">(select a make)</span>
              ) : null}
            </label>
            <select
              id="filter-model"
              value={modelFilter ?? ""}
              disabled={makeFilter === null}
              onChange={(e) => {
                const v = e.target.value;
                setModelFilter(v === "" ? null : v);
              }}
              className={`${selectClass} enabled:hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[180px]`}
            >
              <option value="">Any model</option>
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="sort" className="block text-sm font-medium text-slate-300">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={`${selectClass} sm:min-w-[200px]`}
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
        <div
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading vehicle inventory"
          aria-busy="true"
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-16 text-center text-slate-500" role="status">
          No vehicles match your search. Try a broader term.
        </p>
      ) : (
        <>
          <p
            className="mt-6 text-sm text-slate-400"
            aria-live="polite"
            aria-atomic="true"
          >
            Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
          </p>
          <ul className="mt-6 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visibleCount).map((v, i) => (
              <li key={v.id}>
                <VehicleCard vehicle={v} priority={i < 3} />
              </li>
            ))}
          </ul>
          {visibleCount < filtered.length && (
            <div className="mt-10 flex justify-center">
              <button
                ref={loadMoreRef}
                type="button"
                onClick={loadMore}
                className="min-h-[48px] rounded-xl border border-slate-700 bg-slate-900 px-8 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
