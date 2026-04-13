import type { Vehicle } from "../types/vehicle";

/**
 * Builds a single lowercase string from all searchable fields of a vehicle,
 * used for full-text substring matching.
 *
 * @param v - The vehicle to index.
 * @returns A space-joined, lowercased string of all searchable field values.
 */
function vehicleSearchBlob(v: Vehicle): string {
  return [
    v.make,
    v.model,
    v.trim,
    v.vin,
    v.lot,
    v.city,
    v.province,
    v.selling_dealership,
    v.body_style,
    String(v.year),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Returns true if the vehicle's searchable text contains the trimmed query
 * as a substring (case-insensitive). An empty or whitespace-only query always
 * matches.
 *
 * @param vehicle - The vehicle to test.
 * @param query   - The raw search string entered by the user.
 */
export function matchesSearch(vehicle: Vehicle, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return vehicleSearchBlob(vehicle).includes(q);
}

export type SortKey = "relevance" | "current_bid_desc" | "year_desc" | "auction_start";

/**
 * Returns a new array containing the same vehicles sorted according to the
 * given key. The original array is not mutated.
 *
 * - `"current_bid_desc"` — highest current bid first.
 * - `"year_desc"`        — newest model year first.
 * - `"auction_start"`    — earliest auction start first.
 * - `"relevance"`        — preserves original listing order.
 *
 * @param list - The vehicles to sort.
 * @param sort - The sort strategy to apply.
 */
export function sortVehicles(list: Vehicle[], sort: SortKey): Vehicle[] {
  const out = [...list];
  switch (sort) {
    case "current_bid_desc":
      out.sort((a, b) => b.current_bid - a.current_bid);
      break;
    case "year_desc":
      out.sort((a, b) => b.year - a.year);
      break;
    case "auction_start": {
      const ts = new Map(out.map((v) => [v.id, new Date(v.auction_start).getTime()]));
      out.sort((a, b) => ts.get(a.id)! - ts.get(b.id)!);
      break;
    }
    default:
      break;
  }
  return out;
}
