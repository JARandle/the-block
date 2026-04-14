/**
 * Tests for the useMarketPrice hook.
 *
 * Each test receives a **fresh module** via vi.resetModules() + dynamic import
 * so the module-level priceCache Map starts empty and cache state never leaks
 * between tests.
 *
 * jsdom does not expose a native `fetch` global, so each test uses
 * vi.stubGlobal('fetch', vi.fn()) to install the mock before importing the
 * module under test.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketPriceResult, MarketPriceFetchStatus } from "./useMarketPrice";

// ---------------------------------------------------------------------------
// Helper types & factories
// ---------------------------------------------------------------------------

type UseMarketPrice = (
  make: string,
  model: string,
  year: number,
  enabled: boolean,
) => MarketPriceResult;

/** Builds a minimal Response-like object accepted by the fetch mock. */
function makeFetchResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("useMarketPrice", () => {
  let useMarketPrice: UseMarketPrice;
  // fetchMock is re-created in beforeEach so every test has its own clean spy.
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Fresh module instance → empty priceCache for every test.
    vi.resetModules();
    // Install a stub fetch on globalThis before importing the hook so that
    // any call to fetch() inside the module resolves to our mock.
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const mod = await import("./useMarketPrice");
    useMarketPrice = mod.useMarketPrice;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  // -------------------------------------------------------------------------
  // Idle / disabled
  // -------------------------------------------------------------------------

  describe("when enabled is false", () => {
    it("stays idle and never calls fetch", () => {
      const { result } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2022, false),
      );

      expect(result.current.status).toBe<MarketPriceFetchStatus>("idle");
      expect(result.current.marketPrice).toBeNull();
      expect(result.current.errorMessage).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("remains idle when re-rendered with enabled still false", () => {
      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useMarketPrice("Toyota", "Camry", 2022, enabled),
        { initialProps: { enabled: false } },
      );

      rerender({ enabled: false });
      expect(result.current.status).toBe<MarketPriceFetchStatus>("idle");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Missing API key
  // -------------------------------------------------------------------------

  describe("when VITE_MARKETCHECK_API_KEY is not configured", () => {
    it("transitions to error immediately with a descriptive message", async () => {
      vi.stubEnv("VITE_MARKETCHECK_API_KEY", "");
      // Re-import with empty env so the hook reads the updated value.
      vi.resetModules();
      vi.stubGlobal("fetch", fetchMock);
      const { useMarketPrice: hook } = await import("./useMarketPrice");

      const { result } = renderHook(() => hook("Toyota", "Camry", 2022, true));

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.marketPrice).toBeNull();
      expect(result.current.errorMessage).toContain("not configured");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  describe("loading state", () => {
    it("sets status to 'loading' while the fetch is in-flight", async () => {
      vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key");

      let resolveRequest!: (r: Response) => void;
      fetchMock.mockReturnValueOnce(
        new Promise<Response>((res) => {
          resolveRequest = res;
        }),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Nissan", "Altima", 2022, true),
      );

      expect(result.current.status).toBe<MarketPriceFetchStatus>("loading");
      expect(result.current.marketPrice).toBeNull();

      // Resolve so teardown is clean.
      resolveRequest(makeFetchResponse([{ price: 15_000 }]));
      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Successful fetches — response shape variants
  // -------------------------------------------------------------------------

  describe("successful fetch", () => {
    beforeEach(() => vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key"));

    it("computes the mean price from a flat array response", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: 20_000 }, { price: 30_000 }, { price: 25_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(25_000);
      expect(result.current.errorMessage).toBeNull();
    });

    it("computes the mean price from a wrapped { listings: [...] } response", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ listings: [{ price: 10_000 }, { price: 20_000 }] }),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Honda", "Civic", 2021, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(15_000);
    });

    it("rounds fractional means to the nearest integer", async () => {
      // mean of 10 000 + 10 001 = 10 000.5 → rounds to 10 001
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: 10_000 }, { price: 10_001 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Ford", "F-150", 2023, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(10_001);
    });

    it("handles a single-listing response", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: 42_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("BMW", "3 Series", 2023, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(42_000);
    });
  });

  // -------------------------------------------------------------------------
  // Price filtering
  // -------------------------------------------------------------------------

  describe("price filtering", () => {
    beforeEach(() => vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key"));

    it("ignores null prices and averages the rest", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: null }, { price: 20_000 }, { price: 30_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Toyota", "RAV4", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(25_000);
    });

    it("ignores zero prices (not a real market listing)", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: 0 }, { price: 30_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Mazda", "CX-5", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(30_000);
    });

    it("ignores negative prices", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: -5_000 }, { price: 25_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Subaru", "Outback", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(25_000);
    });

    it("ignores non-numeric price values", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: "unknown" }, { price: 20_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Kia", "Sorento", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(20_000);
    });

    it("ignores listings with no price key at all", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{}, { price: 18_000 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Jeep", "Wrangler", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(result.current.marketPrice).toBe(18_000);
    });

    it("returns error when all prices are invalid or absent", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse([{ price: null }, { price: 0 }, { price: -100 }]),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Audi", "A4", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.marketPrice).toBeNull();
      expect(result.current.errorMessage).toMatch(/No listings found/);
    });

    it("returns error for an empty listings array", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse([]));

      const { result } = renderHook(() =>
        useMarketPrice("Unknown", "Ghost", 2015, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.errorMessage).toMatch(/No listings found/);
    });
  });

  // -------------------------------------------------------------------------
  // Unrecognised response shapes
  // -------------------------------------------------------------------------

  describe("unrecognised response shapes", () => {
    beforeEach(() => vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key"));

    it("treats an object without a 'listings' key as empty", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ total: 0, count: 0 }),
      );

      const { result } = renderHook(() =>
        useMarketPrice("VW", "Passat", 2020, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
    });

    it("treats a top-level string response as empty", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse("unexpected string"),
      );

      const { result } = renderHook(() =>
        useMarketPrice("Porsche", "911", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
    });

    it("treats a null response body as empty", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(null));

      const { result } = renderHook(() =>
        useMarketPrice("Ferrari", "Roma", 2023, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
    });
  });

  // -------------------------------------------------------------------------
  // HTTP and network errors
  // -------------------------------------------------------------------------

  describe("error handling", () => {
    beforeEach(() => vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key"));

    it("transitions to error on HTTP 404 and includes the status code", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse({}, 404));

      const { result } = renderHook(() =>
        useMarketPrice("Tesla", "Model 3", 2022, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.errorMessage).toContain("404");
    });

    it("transitions to error on HTTP 500", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse({}, 500));

      const { result } = renderHook(() =>
        useMarketPrice("Tesla", "Model Y", 2023, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.errorMessage).toContain("500");
    });

    it("transitions to error on a network failure and forwards the message", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() =>
        useMarketPrice("Rivian", "R1T", 2023, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.errorMessage).toBe("Network error");
    });

    it("uses a generic message when a non-Error is thrown", async () => {
      fetchMock.mockRejectedValueOnce("string error");

      const { result } = renderHook(() =>
        useMarketPrice("Lucid", "Air", 2023, true),
      );

      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("error"),
      );
      expect(result.current.errorMessage).toBe("Failed to fetch market price.");
    });
  });

  // -------------------------------------------------------------------------
  // Module-level cache
  // -------------------------------------------------------------------------

  describe("caching", () => {
    beforeEach(() => vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key"));

    it("does not call fetch a second time for the same make/model/year", async () => {
      fetchMock.mockResolvedValue(makeFetchResponse([{ price: 20_000 }]));

      const { result: r1 } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2022, true),
      );
      await waitFor(() =>
        expect(r1.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      const { result: r2 } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2022, true),
      );
      await waitFor(() =>
        expect(r2.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(r2.current.marketPrice).toBe(20_000);
    });

    it("fetches separately for different years of the same make/model", async () => {
      fetchMock.mockResolvedValue(makeFetchResponse([{ price: 20_000 }]));

      const { result: r1 } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2022, true),
      );
      await waitFor(() =>
        expect(r1.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      const { result: r2 } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2023, true),
      );
      await waitFor(() =>
        expect(r2.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("fetches separately for different makes with the same model and year", async () => {
      fetchMock.mockResolvedValue(makeFetchResponse([{ price: 30_000 }]));

      const { result: r1 } = renderHook(() =>
        useMarketPrice("Ford", "Edge", 2022, true),
      );
      await waitFor(() =>
        expect(r1.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      const { result: r2 } = renderHook(() =>
        useMarketPrice("Lincoln", "Edge", 2022, true),
      );
      await waitFor(() =>
        expect(r2.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("clears errorMessage when a cache hit has a valid price", async () => {
      // Prime the cache with a real price.
      fetchMock.mockResolvedValueOnce(makeFetchResponse([{ price: 20_000 }]));

      const { result: r1 } = renderHook(() =>
        useMarketPrice("GM", "Bolt", 2023, true),
      );
      await waitFor(() =>
        expect(r1.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      // Second hook reads from cache; errorMessage must be null, not stale.
      const { result: r2 } = renderHook(() =>
        useMarketPrice("GM", "Bolt", 2023, true),
      );
      await waitFor(() =>
        expect(r2.current.status).toBe<MarketPriceFetchStatus>("success"),
      );
      expect(r2.current.errorMessage).toBeNull();
    });

    it("caches a null result and immediately reports error without a second fetch", async () => {
      // First call → API returns empty listings → cache stores null.
      fetchMock.mockResolvedValueOnce(makeFetchResponse([]));

      const { result: r1 } = renderHook(() =>
        useMarketPrice("Unknown", "Model", 2010, true),
      );
      await waitFor(() =>
        expect(r1.current.status).toBe<MarketPriceFetchStatus>("error"),
      );

      // Reset the call count; second hook instance must NOT trigger a new fetch.
      fetchMock.mockClear();

      const { result: r2 } = renderHook(() =>
        useMarketPrice("Unknown", "Model", 2010, true),
      );
      await waitFor(() =>
        expect(r2.current.status).toBe<MarketPriceFetchStatus>("error"),
      );

      expect(fetchMock).not.toHaveBeenCalled();
      expect(r2.current.errorMessage).toMatch(/No listings found/);
    });
  });

  // -------------------------------------------------------------------------
  // Abort on unmount
  // -------------------------------------------------------------------------

  describe("cleanup / abort", () => {
    it("does not update state after the component unmounts mid-fetch", async () => {
      vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key");

      let resolveRequest!: (r: Response) => void;
      fetchMock.mockReturnValueOnce(
        new Promise<Response>((res) => {
          resolveRequest = res;
        }),
      );

      const { result, unmount } = renderHook(() =>
        useMarketPrice("Chrysler", "Pacifica", 2022, true),
      );

      expect(result.current.status).toBe<MarketPriceFetchStatus>("loading");

      // Unmount triggers the cleanup → controller.abort() is called.
      unmount();

      // Resolve after unmount — state must not change.
      resolveRequest(makeFetchResponse([{ price: 30_000 }]));
      await new Promise((r) => setTimeout(r, 0));

      expect(result.current.status).toBe<MarketPriceFetchStatus>("loading");
    });
  });

  // -------------------------------------------------------------------------
  // URL construction
  // -------------------------------------------------------------------------

  describe("request construction", () => {
    it("includes make, model, year, and api_key in the request URL", async () => {
      vi.stubEnv("VITE_MARKETCHECK_API_KEY", "my-secret-key");
      fetchMock.mockResolvedValueOnce(makeFetchResponse([{ price: 20_000 }]));

      const { result } = renderHook(() =>
        useMarketPrice("Toyota", "Camry", 2022, true),
      );
      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("make=Toyota");
      expect(calledUrl).toContain("model=Camry");
      expect(calledUrl).toContain("year=2022");
      expect(calledUrl).toContain("api_key=my-secret-key");
    });

    it("URL-encodes make and model values that contain special characters", async () => {
      vi.stubEnv("VITE_MARKETCHECK_API_KEY", "test-key");
      fetchMock.mockResolvedValueOnce(makeFetchResponse([{ price: 50_000 }]));

      const { result } = renderHook(() =>
        useMarketPrice("Mercedes-Benz", "GLE 350", 2022, true),
      );
      await waitFor(() =>
        expect(result.current.status).toBe<MarketPriceFetchStatus>("success"),
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("Mercedes-Benz");
      // Spaces are encoded as %20 or +.
      expect(calledUrl).toMatch(/GLE(%20|\+)350/);
    });
  });
});
