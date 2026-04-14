import { describe, expect, it } from "vitest";
import {
  auctionCountdownLabel,
  calcProfit,
  calcProfitMargin,
  formatCurrency,
  formatDateTime,
  profitColour,
  STRONG_MARGIN_THRESHOLD,
} from "./format";

describe("formatCurrency", () => {
  it("formats a typical amount in CAD", () => {
    expect(formatCurrency(12500)).toBe("$12,500");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats a large number with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000");
  });

  it("drops cents (minimumFractionDigits is 0)", () => {
    expect(formatCurrency(9999.99)).toBe("$10,000");
  });
});

describe("formatDateTime", () => {
  it("returns a non-empty string for a valid ISO date", () => {
    const result = formatDateTime("2026-05-01T12:00:00");
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("includes the year in the output", () => {
    const result = formatDateTime("2026-05-01T12:00:00");
    expect(result).toContain("2026");
  });
});

describe("calcProfit", () => {
  it("returns null when marketPrice is null", () => {
    expect(calcProfit(null, 10_000)).toBeNull();
  });

  it("returns positive profit when bid is below market price", () => {
    expect(calcProfit(20_000, 10_000)).toBe(10_000);
  });

  it("returns negative profit when bid exceeds market price", () => {
    expect(calcProfit(10_000, 20_000)).toBe(-10_000);
  });

  it("returns zero when bid equals market price (break-even)", () => {
    expect(calcProfit(15_000, 15_000)).toBe(0);
  });

  it("returns the full market price when current bid is zero", () => {
    expect(calcProfit(25_000, 0)).toBe(25_000);
  });

  it("handles a market price of zero with a zero bid", () => {
    expect(calcProfit(0, 0)).toBe(0);
  });

  it("handles a market price of zero with a non-zero bid", () => {
    expect(calcProfit(0, 5_000)).toBe(-5_000);
  });

  it("handles large numbers without precision loss", () => {
    expect(calcProfit(200_000, 150_000)).toBe(50_000);
  });
});

describe("calcProfitMargin", () => {
  it("returns null when marketPrice is null", () => {
    expect(calcProfitMargin(null, 10_000)).toBeNull();
  });

  it("returns null when marketPrice is zero (avoids division by zero)", () => {
    expect(calcProfitMargin(0, 10_000)).toBeNull();
  });

  it("returns null when both marketPrice and bid are zero", () => {
    expect(calcProfitMargin(0, 0)).toBeNull();
  });

  it("returns 0.5 when bid is exactly half the market price", () => {
    expect(calcProfitMargin(20_000, 10_000)).toBe(0.5);
  });

  it("returns 0 at break-even (bid equals market price)", () => {
    expect(calcProfitMargin(15_000, 15_000)).toBe(0);
  });

  it("returns negative margin when bid exceeds market price", () => {
    expect(calcProfitMargin(10_000, 20_000)).toBe(-1);
  });

  it("returns 1 when bid is zero (entire market price is profit)", () => {
    expect(calcProfitMargin(10_000, 0)).toBe(1);
  });

  it("returns a fractional margin matching (market - bid) / market", () => {
    // bid = 17 000, market = 20 000 → margin = 3000/20000 = 0.15
    expect(calcProfitMargin(20_000, 17_000)).toBeCloseTo(0.15);
  });

  it("handles very small margins without floating-point catastrophe", () => {
    // bid = 19 999, market = 20 000 → margin ≈ 0.00005
    const margin = calcProfitMargin(20_000, 19_999);
    expect(margin).not.toBeNull();
    expect(margin!).toBeGreaterThan(0);
    expect(margin!).toBeLessThan(0.001);
  });
});

describe("profitColour", () => {
  it("returns muted class when margin is null", () => {
    expect(profitColour(null)).toBe("text-slate-400");
  });

  it("returns green at exactly the strong-margin threshold", () => {
    expect(profitColour(STRONG_MARGIN_THRESHOLD)).toBe("text-emerald-400");
  });

  it("returns green above the strong-margin threshold", () => {
    expect(profitColour(0.5)).toBe("text-emerald-400");
    expect(profitColour(1)).toBe("text-emerald-400");
  });

  it("returns amber just below the strong-margin threshold", () => {
    expect(profitColour(STRONG_MARGIN_THRESHOLD - 0.001)).toBe("text-amber-300");
  });

  it("returns amber for any small positive margin", () => {
    expect(profitColour(0.01)).toBe("text-amber-300");
    expect(profitColour(0.14)).toBe("text-amber-300");
  });

  it("returns red at break-even (margin is zero)", () => {
    expect(profitColour(0)).toBe("text-red-400");
  });

  it("returns red when bid exceeds market price (negative margin)", () => {
    expect(profitColour(-0.01)).toBe("text-red-400");
    expect(profitColour(-1)).toBe("text-red-400");
    expect(profitColour(-100)).toBe("text-red-400");
  });
});

describe("auctionCountdownLabel", () => {
  it("returns 'Auction in progress' when diff is zero", () => {
    const now = new Date("2026-05-01T12:00:00Z");
    expect(auctionCountdownLabel("2026-05-01T12:00:00Z", now)).toBe(
      "Auction in progress",
    );
  });

  it("returns 'Auction in progress' when auction start is in the past", () => {
    const now = new Date("2026-05-01T13:00:00Z");
    expect(auctionCountdownLabel("2026-05-01T12:00:00Z", now)).toBe(
      "Auction in progress",
    );
  });

  it("returns days when more than 48 hours remain", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const start = new Date("2026-05-04T00:00:00Z").toISOString(); // 72 h away
    const label = auctionCountdownLabel(start, now);
    expect(label).toMatch(/^Starts in \d+ days$/);
    expect(label).toContain("3 days");
  });

  it("returns days boundary at exactly 48 hours", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const start = new Date("2026-05-03T00:00:00Z").toISOString(); // exactly 48 h
    const label = auctionCountdownLabel(start, now);
    expect(label).toMatch(/^Starts in \d+ days$/);
  });

  it("returns hours and minutes when between 1 h and 48 h remain", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const start = new Date("2026-05-01T02:30:00Z").toISOString(); // 2h 30m away
    expect(auctionCountdownLabel(start, now)).toBe("Starts in 2h 30m");
  });

  it("returns minutes when less than 1 hour but at least 1 minute remains", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const start = new Date("2026-05-01T00:45:00Z").toISOString(); // 45 min away
    expect(auctionCountdownLabel(start, now)).toBe("Starts in 45 min");
  });

  it("returns 'Starting soon' when less than 1 minute remains", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const start = new Date("2026-05-01T00:00:30Z").toISOString(); // 30 s away
    expect(auctionCountdownLabel(start, now)).toBe("Starting soon");
  });

  it("returns hours+minutes=0m correctly for exact hours", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const start = new Date("2026-05-01T03:00:00Z").toISOString(); // exactly 3h
    expect(auctionCountdownLabel(start, now)).toBe("Starts in 3h 0m");
  });
});
