import { describe, expect, it } from "vitest";
import { buildVehicleFilterIndex, filterAndSortInventory } from "./inventoryFilters";
import type { Vehicle } from "../types/vehicle";

const vehicle = (partial: Partial<Vehicle>): Vehicle =>
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

const defaultListParams = {
  savedOnly: false,
  isWatchlisted: () => false,
  year: null as number | null,
  make: null as string | null,
  model: null as string | null,
  query: "",
  sort: "relevance" as const,
};

describe("buildVehicleFilterIndex", () => {
  it("returns empty index for no vehicles", () => {
    const idx = buildVehicleFilterIndex([]);
    expect(idx.yearOptions).toEqual([]);
    expect(idx.makeOptions).toEqual([]);
    expect(idx.modelsForMake.size).toBe(0);
  });

  it("dedupes years and sorts newest first", () => {
    const idx = buildVehicleFilterIndex([
      vehicle({ id: "a", year: 2019 }),
      vehicle({ id: "b", year: 2022 }),
      vehicle({ id: "c", year: 2022 }),
    ]);
    expect(idx.yearOptions).toEqual([2022, 2019]);
  });

  it("dedupes makes and sorts alphabetically", () => {
    const idx = buildVehicleFilterIndex([
      vehicle({ id: "a", make: "Mazda" }),
      vehicle({ id: "b", make: "Ford" }),
      vehicle({ id: "c", make: "Ford" }),
    ]);
    expect(idx.makeOptions).toEqual(["Ford", "Mazda"]);
  });

  it("groups models by make and sorts model names", () => {
    const idx = buildVehicleFilterIndex([
      vehicle({ id: "a", make: "Honda", model: "Accord" }),
      vehicle({ id: "b", make: "Honda", model: "Civic" }),
      vehicle({ id: "c", make: "Honda", model: "Civic" }),
      vehicle({ id: "d", make: "Ford", model: "F-150" }),
    ]);
    expect(idx.modelsForMake.get("Honda")).toEqual(["Accord", "Civic"]);
    expect(idx.modelsForMake.get("Ford")).toEqual(["F-150"]);
  });
});

describe("filterAndSortInventory", () => {
  const a = vehicle({
    id: "a",
    year: 2021,
    make: "Honda",
    model: "Civic",
    current_bid: 200,
    auction_start: "2026-06-01T12:00:00",
  });
  const b = vehicle({
    id: "b",
    year: 2022,
    make: "Ford",
    model: "F-150",
    current_bid: 500,
    auction_start: "2026-04-01T12:00:00",
  });
  const c = vehicle({
    id: "c",
    year: 2022,
    make: "Honda",
    model: "Accord",
    current_bid: 300,
    auction_start: "2026-05-01T12:00:00",
  });
  const list = [a, b, c];

  it("applies year filter when set", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      year: 2022,
    });
    expect(out.map((v) => v.id)).toEqual(["b", "c"]);
  });

  it("applies make filter when set", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      make: "Honda",
    });
    expect(out.map((v) => v.id).sort()).toEqual(["a", "c"]);
  });

  it("applies model filter when set", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      model: "Accord",
    });
    expect(out.map((v) => v.id)).toEqual(["c"]);
  });

  it("combines year, make, and model filters", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      year: 2022,
      make: "Honda",
      model: "Accord",
    });
    expect(out.map((v) => v.id)).toEqual(["c"]);
  });

  it("applies search query after attribute filters", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      make: "Honda",
      query: "accord",
    });
    expect(out.map((v) => v.id)).toEqual(["c"]);
  });

  it("restricts to watchlisted ids when savedOnly is true", () => {
    const watch = new Set(["b"]);
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      savedOnly: true,
      isWatchlisted: (id) => watch.has(id),
    });
    expect(out.map((v) => v.id)).toEqual(["b"]);
  });

  it("sorts results using sort key", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      sort: "current_bid_desc",
    });
    expect(out.map((v) => v.id)).toEqual(["b", "c", "a"]);
  });

  it("uses auction_start sort when requested", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      sort: "auction_start",
    });
    expect(out.map((v) => v.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts by year desc when requested", () => {
    // a=2021, b=2022, c=2022 — ties resolved by original sort stability
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      sort: "year_desc",
    });
    expect(out[0].year).toBeGreaterThanOrEqual(out[1].year);
    expect(out[1].year).toBeGreaterThanOrEqual(out[2].year);
    // id "a" (2021) must be last
    expect(out[out.length - 1].id).toBe("a");
  });

  it("relevance sort returns all vehicles in original order", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      sort: "relevance",
    });
    expect(out.map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("returns all vehicles when no filters are applied", () => {
    const out = filterAndSortInventory(list, defaultListParams);
    expect(out).toHaveLength(list.length);
  });

  it("returns empty array for empty input", () => {
    const out = filterAndSortInventory([], defaultListParams);
    expect(out).toEqual([]);
  });

  it("returns empty array when no vehicles match a filter", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      make: "Toyota",
    });
    expect(out).toEqual([]);
  });

  it("savedOnly with empty watchlist returns nothing", () => {
    const out = filterAndSortInventory(list, {
      ...defaultListParams,
      savedOnly: true,
      isWatchlisted: () => false,
    });
    expect(out).toEqual([]);
  });
});
