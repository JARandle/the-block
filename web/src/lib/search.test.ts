import { describe, expect, it } from "vitest";
import { matchesSearch, sortVehicles } from "./search";
import type { Vehicle } from "../types/vehicle";

const v = (partial: Partial<Vehicle>): Vehicle =>
  ({
    id: "x",
    vin: "V",
    year: 2020,
    make: "Honda",
    model: "Civic",
    trim: "Sport",
    body_style: "Sedan",
    exterior_color: "Blue",
    interior_color: "Black",
    engine: "1.5T",
    transmission: "CVT",
    drivetrain: "FWD",
    odometer_km: 1,
    fuel_type: "gasoline",
    condition_grade: 4,
    condition_report: "ok",
    damage_notes: [],
    title_status: "clean",
    province: "ON",
    city: "Ottawa",
    auction_start: "2026-05-01T12:00:00",
    starting_bid: 1,
    reserve_price: 2,
    buy_now_price: null,
    images: [],
    selling_dealership: "ABC Motors",
    lot: "B-9",
    current_bid: 100,
    bid_count: 1,
    ...partial,
  }) as Vehicle;

describe("matchesSearch", () => {
  it("matches make case-insensitively", () => {
    expect(matchesSearch(v({ make: "Honda" }), "honda")).toBe(true);
  });

  it("matches VIN substring", () => {
    expect(matchesSearch(v({ vin: "ABC123XYZ" }), "123")).toBe(true);
  });

  it("empty query matches", () => {
    expect(matchesSearch(v({}), "  ")).toBe(true);
  });
});

describe("sortVehicles", () => {
  it("sorts by current bid desc", () => {
    const a = v({ id: "a", current_bid: 100 });
    const b = v({ id: "b", current_bid: 500 });
    const out = sortVehicles([a, b], "current_bid_desc");
    expect(out.map((x) => x.id)).toEqual(["b", "a"]);
  });
});
