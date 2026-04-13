import type { Vehicle } from "../types/vehicle";
import { matchesSearch, sortVehicles, type SortKey } from "./search";

export type VehicleFilterIndex = {
  yearOptions: number[];
  makeOptions: string[];
  /** Sorted model names per make */
  modelsForMake: Map<string, string[]>;
};

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

/** Single pass over vehicles for year/make/model option lists. */
export function buildVehicleFilterIndex(vehicles: Vehicle[]): VehicleFilterIndex {
  const years = new Set<number>();
  const makes = new Set<string>();
  const modelSets = new Map<string, Set<string>>();

  for (const v of vehicles) {
    years.add(v.year);
    makes.add(v.make);
    let ms = modelSets.get(v.make);
    if (!ms) {
      ms = new Set();
      modelSets.set(v.make, ms);
    }
    ms.add(v.model);
  }

  const yearOptions = [...years].sort((a, b) => b - a);
  const makeOptions = [...makes].sort((a, b) => collator.compare(a, b));

  const modelsForMake = new Map<string, string[]>();
  for (const [make, set] of modelSets) {
    modelsForMake.set(make, [...set].sort((a, b) => collator.compare(a, b)));
  }

  return { yearOptions, makeOptions, modelsForMake };
}

export type InventoryListParams = {
  savedOnly: boolean;
  isWatchlisted: (vehicleId: string) => boolean;
  year: number | null;
  make: string | null;
  model: string | null;
  query: string;
  sort: SortKey;
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
  list = list.filter((v) => matchesSearch(v, params.query));
  return sortVehicles(list, params.sort);
}
