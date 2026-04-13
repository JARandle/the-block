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

  it("returns false when query does not match any field", () => {
    expect(matchesSearch(v({ make: "Honda", model: "Civic" }), "zzznotfound")).toBe(false);
  });

  it("matches model case-insensitively", () => {
    expect(matchesSearch(v({ model: "Accord" }), "accord")).toBe(true);
  });

  it("matches lot number", () => {
    expect(matchesSearch(v({ lot: "A-0042" }), "A-0042")).toBe(true);
  });

  it("matches city", () => {
    expect(matchesSearch(v({ city: "Vancouver" }), "vancouver")).toBe(true);
  });

  it("matches year as string", () => {
    expect(matchesSearch(v({ year: 2021 }), "2021")).toBe(true);
  });

  it("matches selling_dealership", () => {
    expect(matchesSearch(v({ selling_dealership: "Sunrise Motors" }), "sunrise")).toBe(true);
  });

  it("matches body_style", () => {
    expect(matchesSearch(v({ body_style: "Convertible" }), "convert")).toBe(true);
  });

  it("matches province", () => {
    expect(matchesSearch(v({ province: "BC" }), "bc")).toBe(true);
  });
});

describe("sortVehicles", () => {
  it("sorts by current bid desc", () => {
    const a = v({ id: "a", current_bid: 100 });
    const b = v({ id: "b", current_bid: 500 });
    const out = sortVehicles([a, b], "current_bid_desc");
    expect(out.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("sorts by year desc", () => {
    const a = v({ id: "a", year: 2019 });
    const b = v({ id: "b", year: 2023 });
    const c = v({ id: "c", year: 2021 });
    const out = sortVehicles([a, b, c], "year_desc");
    expect(out.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("relevance sort preserves original order", () => {
    const a = v({ id: "a" });
    const b = v({ id: "b" });
    const c = v({ id: "c" });
    const out = sortVehicles([a, b, c], "relevance");
    expect(out.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input array", () => {
    const a = v({ id: "a", current_bid: 100 });
    const b = v({ id: "b", current_bid: 500 });
    const input = [a, b];
    sortVehicles(input, "current_bid_desc");
    expect(input.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("sorts by auction_start ascending", () => {
    const a = v({ id: "a", auction_start: "2026-06-01T00:00:00" });
    const b = v({ id: "b", auction_start: "2026-04-01T00:00:00" });
    const c = v({ id: "c", auction_start: "2026-05-01T00:00:00" });
    const out = sortVehicles([a, b, c], "auction_start");
    expect(out.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});
