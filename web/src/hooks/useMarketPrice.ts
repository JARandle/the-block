import { useEffect, useState } from "react";

/**
 * Number of active listings to request per Marketcheck search. Enough to give
 * a representative market average without exhausting free-tier quota.
 */
const MARKET_SEARCH_ROWS = 20;

/**
 * Module-level in-memory cache keyed by `"make|model|year"`. Persists for the
 * lifetime of the page session so that toggling a card open and closed, or
 * viewing multiple cards for the same make/model/year, never fires a second
 * network request for the same market segment.
 *
 * The value is `null` when the API returned no usable listings.
 */
const priceCache = new Map<string, number | null>();

/** Represents the lifecycle of the Marketcheck API request. */
export type MarketPriceFetchStatus = "idle" | "loading" | "success" | "error";

export interface MarketPriceResult {
  /** Mean market price derived from active Marketcheck listings, or `null`. */
  marketPrice: number | null;
  /** Current request lifecycle state. */
  status: MarketPriceFetchStatus;
  /** Human-readable error description when `status === "error"`. */
  errorMessage: string | null;
}

/** Shape of a single listing returned by `/v2/search/car/active`. */
interface MarketListing {
  price?: number | null;
}

/**
 * Fetches the mean market price for a vehicle from the
 * [Marketcheck API](https://www.marketcheck.com/) by searching active used-car
 * listings for the same make, model, and year, then averaging the prices of
 * the returned results.
 *
 * Using make/model/year instead of VIN means the lookup works regardless of
 * whether the VIN exists in Marketcheck's database, making it compatible with
 * test or synthetic vehicle data.
 *
 * **Lazy by design** — the fetch is deferred until `enabled` is `true`. Wire
 * this to a user-controlled toggle so API quota is only consumed on demand
 * rather than for every card rendered on the page.
 *
 * **Caching** — results are stored in a module-level Map keyed by
 * `"make|model|year"` for the page session. Repeated toggles or multiple cards
 * for the same segment return the cached value instantly.
 *
 * **Setup** — add your key to a `.env.local` file in the `web/` directory:
 * ```
 * VITE_MARKETCHECK_API_KEY=your_key_here
 * ```
 * Free tier: 100 requests / day. Keys are obtained at
 * https://www.marketcheck.com/marketcheck-apis/pricing/
 *
 * **Currency note** — Marketcheck primarily indexes USD listings. The returned
 * mean price should be treated as an approximate market signal rather than a
 * precise CAD figure. A production implementation would multiply by a live
 * USD→CAD exchange rate.
 *
 * @param make    - Vehicle make (e.g. `"Toyota"`).
 * @param model   - Vehicle model (e.g. `"Camry"`).
 * @param year    - Model year (e.g. `2022`).
 * @param enabled - Pass `true` to trigger the fetch. The hook stays idle while
 *                  this is `false`.
 * @returns `{ marketPrice, status, errorMessage }`
 */
export function useMarketPrice(
  make: string,
  model: string,
  year: number,
  enabled: boolean,
): MarketPriceResult {
  const [status, setStatus] = useState<MarketPriceFetchStatus>("idle");
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cacheKey = `${make}|${model}|${year}`;

  useEffect(() => {
    if (!enabled) return;

    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey) ?? null;
      setMarketPrice(cached);
      setStatus(cached !== null ? "success" : "error");
      // Always reset errorMessage so a previous error doesn't linger when the
      // cache returns a valid price on a subsequent enable.
      setErrorMessage(cached === null ? "No listings found for this make/model/year." : null);
      return;
    }

    const apiKey = (import.meta.env.VITE_MARKETCHECK_API_KEY as string | undefined) ?? "";
    if (!apiKey) {
      setStatus("error");
      setErrorMessage("VITE_MARKETCHECK_API_KEY is not configured.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    const controller = new AbortController();
    // Use the Vite dev proxy (/api/marketcheck → api.marketcheck.com) so the
    // browser never makes a cross-origin request directly.
    const url =
      `/api/marketcheck/v2/search/car/active` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&make=${encodeURIComponent(make)}` +
      `&model=${encodeURIComponent(model)}` +
      `&year=${encodeURIComponent(year)}` +
      `&car_type=used` +
      `&rows=${MARKET_SEARCH_ROWS}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Marketcheck API returned HTTP ${res.status}.`);
        return res.json();
      })
      .then((data: unknown) => {
        const listings: MarketListing[] =
          Array.isArray(data)
            ? (data as MarketListing[])
            : (typeof data === "object" && data !== null && "listings" in data)
              ? ((data as { listings: MarketListing[] }).listings ?? [])
              : [];

        const prices = listings
          .map((l) => l.price)
          .filter((p): p is number => typeof p === "number" && p > 0);

        const mean =
          prices.length > 0
            ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
            : null;

        priceCache.set(cacheKey, mean);
        setMarketPrice(mean);
        if (mean !== null) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage("No listings found for this make/model/year.");
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        priceCache.set(cacheKey, null);
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to fetch market price.",
        );
      });

    return () => controller.abort();
  }, [cacheKey, enabled]);

  return { marketPrice, status, errorMessage };
}
