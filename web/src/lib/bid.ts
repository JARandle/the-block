import type { Vehicle } from "../types/vehicle";

export const BID_INCREMENT = 100;

/** Minimum allowed next bid for UI validation (prototype rules). */
export function nextMinimumBid(vehicle: Vehicle): number {
  const beatHigh =
    vehicle.bid_count > 0
      ? vehicle.current_bid + BID_INCREMENT
      : Math.max(vehicle.starting_bid, vehicle.current_bid);
  return Math.max(vehicle.starting_bid, beatHigh);
}

export function validateBidAmount(
  vehicle: Vehicle,
  amount: number
): { ok: true } | { ok: false; message: string } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "Enter a valid bid amount." };
  }
  const min = nextMinimumBid(vehicle);
  if (amount < min) {
    return {
      ok: false,
      message: `Bid must be at least ${min.toLocaleString("en-CA")} CAD.`,
    };
  }
  return { ok: true };
}

export function applySuccessfulBid(vehicle: Vehicle, amount: number): Vehicle {
  return {
    ...vehicle,
    current_bid: amount,
    bid_count: vehicle.bid_count + 1,
  };
}
