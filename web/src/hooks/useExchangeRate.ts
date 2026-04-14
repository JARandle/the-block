import { useEffect, useState } from "react";

/** Lifecycle state for the exchange rate request. */
export type ExchangeRateStatus = "loading" | "success" | "error";

export interface ExchangeRateResult {
  /**
   * Live USD → CAD exchange rate (e.g. `1.38`), or `null` while loading or
   * when the request failed.
   */
  rate: number | null;
  /** Current request lifecycle state. */
  status: ExchangeRateStatus;
}

/**
 * Module-level singleton promise. The first call to {@link fetchUsdToCad}
 * initiates the network request; every subsequent call returns the same
 * in-flight promise, ensuring only one request is ever made per page session
 * regardless of how many components call {@link useExchangeRate} concurrently.
 */
let ratePromise: Promise<number | null> | null = null;

/**
 * Fetches the current USD → CAD spot rate from the
 * [Frankfurter API](https://www.frankfurter.app/), a free, open-source
 * exchange rate service backed by the European Central Bank. No API key is
 * required and the service supports browser requests directly (CORS enabled).
 *
 * The result is shared across all hook instances via a module-level singleton
 * promise, so the network request fires exactly once per page session.
 *
 * @returns The numeric USD → CAD rate, or `null` on failure.
 */
function fetchUsdToCad(): Promise<number | null> {
  if (ratePromise) return ratePromise;

  // Use the Vite dev proxy (/api/frankfurter → api.frankfurter.app) to avoid
  // CORS restrictions on the direct cross-origin browser fetch.
  ratePromise = fetch("/api/frankfurter/latest?from=USD&to=CAD")
    .then((res) => {
      if (!res.ok) throw new Error(`Frankfurter returned HTTP ${res.status}.`);
      return res.json();
    })
    .then((data: unknown) => {
      const rate =
        typeof data === "object" &&
        data !== null &&
        "rates" in data &&
        typeof (data as Record<string, unknown>).rates === "object"
          ? (data as { rates: { CAD?: unknown } }).rates.CAD
          : null;
      return typeof rate === "number" ? rate : null;
    })
    .catch(() => {
      // Reset so callers can retry on next mount if they choose.
      ratePromise = null;
      return null;
    });

  return ratePromise;
}

/**
 * Returns the live USD → CAD exchange rate fetched from
 * [Frankfurter](https://www.frankfurter.app/).
 *
 * The request is initiated on first call and shared across all hook instances
 * via a module-level singleton — subsequent calls receive the same cached
 * result with no extra network requests.
 *
 * Typical usage in a component that displays converted prices:
 * ```tsx
 * const { rate, status } = useExchangeRate();
 * const priceCAD = rate != null && priceUSD != null
 *   ? Math.round(priceUSD * rate)
 *   : null;
 * ```
 *
 * @returns `{ rate, status }` where `rate` is the USD → CAD multiplier.
 */
export function useExchangeRate(): ExchangeRateResult {
  const [rate, setRate] = useState<number | null>(null);
  const [status, setStatus] = useState<ExchangeRateStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    fetchUsdToCad().then((result) => {
      if (cancelled) return;
      setRate(result);
      setStatus(result !== null ? "success" : "error");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { rate, status };
}
