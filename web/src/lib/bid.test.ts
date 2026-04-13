import { describe, expect, it } from "vitest";
import { applySuccessfulBid, nextMinimumBid, validateBidAmount } from "./bid";
import type { Vehicle } from "../types/vehicle";

const base = (overrides: Partial<Vehicle>): Vehicle => ({
  id: "1",
  vin: "VIN",
  year: 2023,
  make: "Ford",
  model: "X",
  trim: "Y",
  body_style: "SUV",
  exterior_color: "Black",
  interior_color: "Grey",
  engine: "V6",
  transmission: "automatic",
  drivetrain: "AWD",
  odometer_km: 10000,
  fuel_type: "gasoline",
  condition_grade: 4,
  condition_report: "ok",
  damage_notes: [],
  title_status: "clean",
  province: "ON",
  city: "Toronto",
  auction_start: "2026-04-05T14:00:00",
  starting_bid: 10000,
  reserve_price: 15000,
  buy_now_price: null,
  images: [],
  selling_dealership: "Dealer",
  lot: "A-1",
  current_bid: 10000,
  bid_count: 0,
  ...overrides,
});

describe("nextMinimumBid", () => {
  it("uses starting bid when no bids yet", () => {
    expect(nextMinimumBid(base({ starting_bid: 5000, current_bid: 5000, bid_count: 0 }))).toBe(
      5000
    );
  });

  it("requires increment when bids exist", () => {
    expect(
      nextMinimumBid(base({ starting_bid: 5000, current_bid: 12000, bid_count: 3 }))
    ).toBe(12100);
  });
});

describe("validateBidAmount", () => {
  it("rejects below minimum", () => {
    const v = base({ starting_bid: 10000, current_bid: 10000, bid_count: 0 });
    const r = validateBidAmount(v, 9999);
    expect(r.ok).toBe(false);
  });

  it("accepts at minimum", () => {
    const v = base({ starting_bid: 10000, current_bid: 10000, bid_count: 0 });
    expect(validateBidAmount(v, 10000).ok).toBe(true);
  });
});

describe("applySuccessfulBid", () => {
  it("updates bid and count", () => {
    const v = base({ current_bid: 10000, bid_count: 2 });
    const n = applySuccessfulBid(v, 10500);
    expect(n.current_bid).toBe(10500);
    expect(n.bid_count).toBe(3);
  });
});
