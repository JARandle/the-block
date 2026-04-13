import type { Vehicle } from "../types/vehicle";

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

export function matchesSearch(vehicle: Vehicle, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return vehicleSearchBlob(vehicle).includes(q);
}

export type SortKey = "relevance" | "current_bid_desc" | "year_desc" | "auction_start";

export function sortVehicles(list: Vehicle[], sort: SortKey): Vehicle[] {
  const out = [...list];
  switch (sort) {
    case "current_bid_desc":
      out.sort((a, b) => b.current_bid - a.current_bid);
      break;
    case "year_desc":
      out.sort((a, b) => b.year - a.year);
      break;
    case "auction_start":
      out.sort(
        (a, b) =>
          new Date(a.auction_start).getTime() - new Date(b.auction_start).getTime()
      );
      break;
    default:
      break;
  }
  return out;
}
