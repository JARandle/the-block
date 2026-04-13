import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Vehicle } from "../types/vehicle";
import { applySuccessfulBid, validateBidAmount } from "../lib/bid";

const STORAGE_KEY = "the-block-bid-overrides";

type Overrides = Record<string, Pick<Vehicle, "current_bid" | "bid_count">>;

/**
 * Reads any locally-placed bid overrides from `localStorage` and returns them
 * as a plain object keyed by vehicle ID. Returns an empty object if the key is
 * absent or the stored value is malformed.
 */
function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Overrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Persists the current bid override map to `localStorage`. Any write errors
 * (e.g. quota exceeded) are silently ignored.
 *
 * @param o - The overrides object to persist.
 */
function saveOverrides(o: Overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  } catch {
    /* ignore quota */
  }
}

/**
 * Merges any locally-stored bid override for a vehicle onto its base record.
 * If no override exists for the vehicle the base record is returned as-is.
 *
 * @param base      - The original vehicle record from the data source.
 * @param overrides - The current map of locally-placed bid overrides.
 * @returns The vehicle with `current_bid` and `bid_count` from the override
 *          applied, or the unmodified base when no override is present.
 */
function mergeVehicle(base: Vehicle, overrides: Overrides): Vehicle {
  const o = overrides[base.id];
  if (!o) return base;
  return { ...base, current_bid: o.current_bid, bid_count: o.bid_count };
}

type VehiclesContextValue = {
  vehicles: Vehicle[];
  mergedVehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  getVehicle: (id: string) => Vehicle | undefined;
  placeBid: (
    id: string,
    amount: number
  ) => { ok: true } | { ok: false; message: string };
};

const VehiclesContext = createContext<VehiclesContextValue | null>(null);

/**
 * Context provider that fetches the vehicle inventory from `/vehicles.json`,
 * merges any locally-stored bid overrides, and exposes the result along with
 * bid-placement logic to the component tree.
 *
 * Wrap your component tree with this provider to make
 * {@link useVehiclesContext} available to descendants.
 */
export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<Vehicle[]>([]);
  const [overrides, setOverrides] = useState<Overrides>(() =>
    typeof window === "undefined" ? {} : loadOverrides()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/vehicles.json");
        if (!res.ok) throw new Error(`Failed to load inventory (${res.status})`);
        const data = (await res.json()) as Vehicle[];
        if (!cancelled) setRaw(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load inventory");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedVehicles = useMemo(
    () => raw.map((v) => mergeVehicle(v, overrides)),
    [raw, overrides]
  );

  const byId = useMemo(() => {
    const m = new Map<string, Vehicle>();
    for (const v of mergedVehicles) m.set(v.id, v);
    return m;
  }, [mergedVehicles]);

  const getVehicle = useCallback(
    (id: string) => byId.get(id),
    [byId]
  );

  const placeBid = useCallback(
    (id: string, amount: number): { ok: true } | { ok: false; message: string } => {
      const base = raw.find((v) => v.id === id);
      if (!base) return { ok: false, message: "Vehicle not found." };
      const current = mergeVehicle(base, overrides);
      const check = validateBidAmount(current, amount);
      if (!check.ok) return check;
      const next = applySuccessfulBid(current, amount);
      setOverrides((prev) => {
        const nextOverrides = {
          ...prev,
          [id]: { current_bid: next.current_bid, bid_count: next.bid_count },
        };
        saveOverrides(nextOverrides);
        return nextOverrides;
      });
      return { ok: true };
    },
    [raw, overrides]
  );

  const value = useMemo(
    () => ({
      vehicles: raw,
      mergedVehicles,
      loading,
      error,
      getVehicle,
      placeBid,
    }),
    [raw, mergedVehicles, loading, error, getVehicle, placeBid]
  );

  return (
    <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>
  );
}

/**
 * Returns the nearest {@link VehiclesContext} value. Must be called inside a
 * component tree that is wrapped by {@link VehiclesProvider}.
 *
 * @throws {Error} If no `VehiclesProvider` ancestor is present.
 */
export function useVehiclesContext(): VehiclesContextValue {
  const ctx = useContext(VehiclesContext);
  if (!ctx) throw new Error("useVehiclesContext must be used within VehiclesProvider");
  return ctx;
}
