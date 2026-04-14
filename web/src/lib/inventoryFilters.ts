import type { Vehicle } from "../types/vehicle";
import { matchesBlob, matchesSearch, sortVehicles, vehicleSearchBlob, type SortKey } from "./search";

export type VehicleFilterIndex = {
  yearOptions: number[];
  makeOptions: string[];
  /** Sorted model names per make */
  modelsForMake: Map<string, string[]>;
  /**
   * Precomputed search blobs keyed by vehicle ID. Pass to
   * {@link filterAndSortInventory} via `params.searchBlobs` to avoid
   * recomputing the blob string for every vehicle on every keystroke.
   */
  searchBlobs: Map<string, string>;
};

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

/**
 * Single pass over vehicles to build year/make/model option lists and
 * precomputed full-text search blobs.
 *
 * Building search blobs here — once per inventory update — means
 * {@link filterAndSortInventory} can do an `O(1)` Map lookup per vehicle
 * instead of rebuilding the blob string on every keystroke.
 */
export function buildVehicleFilterIndex(vehicles: Vehicle[]): VehicleFilterIndex {
  const years = new Set<number>();
  const makes = new Set<string>();
  const modelSets = new Map<string, Set<string>>();
  const searchBlobs = new Map<string, string>();

  for (const v of vehicles) {
    years.add(v.year);
    makes.add(v.make);
    let ms = modelSets.get(v.make);
    if (!ms) {
      ms = new Set();
      modelSets.set(v.make, ms);
    }
    ms.add(v.model);
    searchBlobs.set(v.id, vehicleSearchBlob(v));
  }

  const yearOptions = [...years].sort((a, b) => b - a);
  const makeOptions = [...makes].sort((a, b) => collator.compare(a, b));

  const modelsForMake = new Map<string, string[]>();
  for (const [make, set] of modelSets) {
    modelsForMake.set(make, [...set].sort((a, b) => collator.compare(a, b)));
  }

  return { yearOptions, makeOptions, modelsForMake, searchBlobs };
}

export type InventoryListParams = {
  savedOnly: boolean;
  isWatchlisted: (vehicleId: string) => boolean;
  year: number | null;
  make: string | null;
  model: string | null;
  query: string;
  sort: SortKey;
  /**
   * Precomputed search blobs from {@link buildVehicleFilterIndex}. When
   * provided, free-text matching uses an `O(1)` Map lookup instead of
   * rebuilding the blob string per vehicle per query.
   */
  searchBlobs?: Map<string, string>;
};

/**
 * Filters and sorts a vehicle list according to the provided parameters.
 *
 * Filters are applied in order: watchlist, year, make, model, free-text search.
 * The surviving vehicles are then sorted by the requested {@link SortKey}.
 *
 * @param vehicles - The full (merged) vehicle array to filter.
 * @param params   - Filter and sort criteria.
 * @returns A new array of vehicles that satisfy all active filters, sorted as
 *          requested.
 */
export function filterAndSortInventory(
  vehicles: Vehicle[],
  params: InventoryListParams,
): Vehicle[] {
  let list = vehicles;
  if (params.savedOnly) list = list.filter((v) => params.isWatchlisted(v.id));
  if (params.year !== null) list = list.filter((v) => v.year === params.year);
  if (params.make !== null) list = list.filter((v) => v.make === params.make);
  if (params.model !== null) list = list.filter((v) => v.model === params.model);
  list = list.filter((v) => {
    const blob = params.searchBlobs?.get(v.id);
    return blob !== undefined
      ? matchesBlob(blob, params.query)
      : matchesSearch(v, params.query);
  });
  return sortVehicles(list, params.sort);
}
