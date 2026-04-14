import { describe, expect, it } from "vitest";
import { auctionCountdownLabel, formatCurrency, formatDateTime } from "./format";

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
