import type { Vehicle } from "../types/vehicle";
import { formatCurrency } from "./format";

export const BID_INCREMENT = 100;

/** Minimum allowed next bid for UI validation (prototype rules). */
export function nextMinimumBid(vehicle: Vehicle): number {
  const beatHigh =
    vehicle.bid_count > 0
      ? vehicle.current_bid + BID_INCREMENT
      : Math.max(vehicle.starting_bid, vehicle.current_bid);
  return Math.max(vehicle.starting_bid, beatHigh);
}

/**
 * Validates a proposed bid amount against the current vehicle state.
 *
 * @param vehicle - The vehicle (with current bid state) being bid on.
 * @param amount  - The proposed bid amount in CAD.
 * @returns `{ ok: true }` when the bid is acceptable, or
 *          `{ ok: false, message }` with a user-facing error string.
 */
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
      message: `Bid must be at least ${formatCurrency(min)}.`,
    };
  }
  return { ok: true };
}

/**
 * Returns a new vehicle object with the bid state updated to reflect a
 * successfully placed bid. The original vehicle object is not mutated.
 *
 * @param vehicle - The vehicle before the bid was placed.
 * @param amount  - The winning bid amount in CAD.
 * @returns A shallow copy of the vehicle with `current_bid` and
 *          `bid_count` updated.
 */
export function applySuccessfulBid(vehicle: Vehicle, amount: number): Vehicle {
  return {
    ...vehicle,
    current_bid: amount,
    bid_count: vehicle.bid_count + 1,
  };
}
