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

  it("uses starting_bid when it exceeds current_bid + increment", () => {
    // starting_bid is higher than current_bid + BID_INCREMENT
    expect(
      nextMinimumBid(base({ starting_bid: 20000, current_bid: 5000, bid_count: 1 }))
    ).toBe(20000);
  });

  it("returns current_bid + increment when current_bid exceeds starting_bid and bids exist", () => {
    expect(
      nextMinimumBid(base({ starting_bid: 5000, current_bid: 50000, bid_count: 10 }))
    ).toBe(50100);
  });

  it("returns starting_bid when bid_count is 0 and current_bid is below starting_bid", () => {
    expect(
      nextMinimumBid(base({ starting_bid: 5000, current_bid: 3000, bid_count: 0 }))
    ).toBe(5000);
  });

  it("returns current_bid when bid_count is 0 and current_bid exceeds starting_bid", () => {
    expect(
      nextMinimumBid(base({ starting_bid: 5000, current_bid: 6000, bid_count: 0 }))
    ).toBe(6000);
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

  it("accepts a value above minimum", () => {
    const v = base({ starting_bid: 10000, current_bid: 10000, bid_count: 0 });
    expect(validateBidAmount(v, 15000).ok).toBe(true);
  });

  it("rejects NaN", () => {
    const v = base({});
    const r = validateBidAmount(v, NaN);
    expect(r.ok).toBe(false);
  });

  it("rejects Infinity", () => {
    const v = base({});
    const r = validateBidAmount(v, Infinity);
    expect(r.ok).toBe(false);
  });

  it("rejects zero", () => {
    const v = base({ starting_bid: 10000, current_bid: 10000, bid_count: 0 });
    const r = validateBidAmount(v, 0);
    expect(r.ok).toBe(false);
  });

  it("rejects a negative amount", () => {
    const v = base({ starting_bid: 10000, current_bid: 10000, bid_count: 0 });
    const r = validateBidAmount(v, -500);
    expect(r.ok).toBe(false);
  });

  it("includes the minimum amount in the error message when below min", () => {
    const v = base({ starting_bid: 10000, current_bid: 10000, bid_count: 0 });
    const r = validateBidAmount(v, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/10,000/);
    }
  });

  it("uses the 'Enter a valid bid amount' message for non-finite inputs", () => {
    const v = base({});
    const rNaN = validateBidAmount(v, NaN);
    const rInf = validateBidAmount(v, Infinity);
    const rZero = validateBidAmount(v, 0);
    const rNeg = validateBidAmount(v, -1);
    for (const r of [rNaN, rInf, rZero, rNeg]) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message).toBe("Enter a valid bid amount.");
      }
    }
  });
});

describe("applySuccessfulBid", () => {
  it("updates bid and count", () => {
    const v = base({ current_bid: 10000, bid_count: 2 });
    const n = applySuccessfulBid(v, 10500);
    expect(n.current_bid).toBe(10500);
    expect(n.bid_count).toBe(3);
  });

  it("does not mutate the original vehicle", () => {
    const v = base({ current_bid: 10000, bid_count: 2 });
    applySuccessfulBid(v, 10500);
    expect(v.current_bid).toBe(10000);
    expect(v.bid_count).toBe(2);
  });

  it("preserves all other vehicle fields unchanged", () => {
    const v = base({ current_bid: 10000, bid_count: 2 });
    const n = applySuccessfulBid(v, 10500);
    expect(n.id).toBe(v.id);
    expect(n.make).toBe(v.make);
    expect(n.starting_bid).toBe(v.starting_bid);
  });

  it("increments bid_count from 0 to 1 for the first-ever bid", () => {
    const v = base({ current_bid: 10000, bid_count: 0 });
    const n = applySuccessfulBid(v, 10000);
    expect(n.bid_count).toBe(1);
    expect(n.current_bid).toBe(10000);
  });
});
