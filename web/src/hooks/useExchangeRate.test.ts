/**
 * Tests for the useExchangeRate hook.
 *
 * The hook uses a module-level singleton promise (`ratePromise`) to ensure only
 * one network request fires per page session. Each test resets this via
 * vi.resetModules() + a fresh dynamic import so singleton state never leaks
 * between tests.
 *
 * jsdom does not expose a native `fetch` global, so each test uses
 * vi.stubGlobal('fetch', vi.fn()) to install the mock.
 */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExchangeRateResult, ExchangeRateStatus } from "./useExchangeRate";

// ---------------------------------------------------------------------------
// Helper types & factories
// ---------------------------------------------------------------------------

type UseExchangeRate = () => ExchangeRateResult;

function makeFetchResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

/** Valid Frankfurter response shape. */
const VALID_RESPONSE = { rates: { CAD: 1.38 } };

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("useExchangeRate", () => {
  let useExchangeRate: UseExchangeRate;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Fresh module instance → singleton ratePromise is null for every test.
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const mod = await import("./useExchangeRate");
    useExchangeRate = mod.useExchangeRate;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe("initial state", () => {
    it("starts in the 'loading' status with a null rate", () => {
      // Fetch never resolves so we can inspect the synchronous initial state.
      fetchMock.mockReturnValueOnce(new Promise(() => {}));

      const { result } = renderHook(() => useExchangeRate());

      expect(result.current.status).toBe<ExchangeRateStatus>("loading");
      expect(result.current.rate).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Successful response
  // -------------------------------------------------------------------------

  describe("successful fetch", () => {
    it("transitions to 'success' and exposes the numeric CAD rate", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(VALID_RESPONSE));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("success"),
      );
      expect(result.current.rate).toBe(1.38);
    });

    it("handles a rate expressed as an integer (e.g. 1)", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ rates: { CAD: 1 } }),
      );

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("success"),
      );
      expect(result.current.rate).toBe(1);
    });

    it("handles a high-precision rate without truncation", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ rates: { CAD: 1.382567 } }),
      );

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("success"),
      );
      expect(result.current.rate).toBeCloseTo(1.382567);
    });
  });

  // -------------------------------------------------------------------------
  // Malformed / unexpected response shapes
  // -------------------------------------------------------------------------

  describe("malformed response", () => {
    it("transitions to 'error' when the response has no 'rates' key", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse({ data: {} }));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
      expect(result.current.rate).toBeNull();
    });

    it("transitions to 'error' when 'rates.CAD' is a string instead of a number", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ rates: { CAD: "1.38" } }),
      );

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
      expect(result.current.rate).toBeNull();
    });

    it("transitions to 'error' when 'rates.CAD' is null", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ rates: { CAD: null } }),
      );

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
      expect(result.current.rate).toBeNull();
    });

    it("transitions to 'error' when 'rates.CAD' is missing entirely", async () => {
      fetchMock.mockResolvedValueOnce(
        makeFetchResponse({ rates: { EUR: 0.92 } }),
      );

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
      expect(result.current.rate).toBeNull();
    });

    it("transitions to 'error' for a top-level array response", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse([1.38]));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
    });

    it("transitions to 'error' for a top-level string response", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse("not json"));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
    });

    it("transitions to 'error' for a null response body", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(null));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
    });
  });

  // -------------------------------------------------------------------------
  // HTTP and network errors
  // -------------------------------------------------------------------------

  describe("HTTP and network errors", () => {
    it("transitions to 'error' on HTTP 500", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse({}, 500));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
      expect(result.current.rate).toBeNull();
    });

    it("transitions to 'error' on HTTP 404", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse({}, 404));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
    });

    it("transitions to 'error' when fetch throws a network error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("error"),
      );
      expect(result.current.rate).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Singleton promise behaviour
  // -------------------------------------------------------------------------

  describe("singleton promise", () => {
    it("calls fetch exactly once when multiple hook instances mount concurrently", async () => {
      fetchMock.mockResolvedValue(makeFetchResponse(VALID_RESPONSE));

      const { result: r1 } = renderHook(() => useExchangeRate());
      const { result: r2 } = renderHook(() => useExchangeRate());
      const { result: r3 } = renderHook(() => useExchangeRate());

      await waitFor(() =>
        expect(r1.current.status).toBe<ExchangeRateStatus>("success"),
      );
      await waitFor(() =>
        expect(r2.current.status).toBe<ExchangeRateStatus>("success"),
      );
      await waitFor(() =>
        expect(r3.current.status).toBe<ExchangeRateStatus>("success"),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(r1.current.rate).toBe(1.38);
      expect(r2.current.rate).toBe(1.38);
      expect(r3.current.rate).toBe(1.38);
    });

    it("calls fetch exactly once when instances mount sequentially", async () => {
      fetchMock.mockResolvedValue(makeFetchResponse(VALID_RESPONSE));

      const { result: r1 } = renderHook(() => useExchangeRate());
      await waitFor(() =>
        expect(r1.current.status).toBe<ExchangeRateStatus>("success"),
      );

      // Second hook mounts after the first has already resolved.
      const { result: r2 } = renderHook(() => useExchangeRate());
      await waitFor(() =>
        expect(r2.current.status).toBe<ExchangeRateStatus>("success"),
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(r2.current.rate).toBe(1.38);
    });

    it("resets the singleton promise after a network failure, permitting a retry", async () => {
      // First attempt fails → ratePromise is reset to null by the catch block.
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const { result: r1 } = renderHook(() => useExchangeRate());
      await waitFor(() =>
        expect(r1.current.status).toBe<ExchangeRateStatus>("error"),
      );

      // Simulate a retry in a fresh module context (ratePromise was reset).
      vi.resetModules();
      fetchMock.mockResolvedValueOnce(makeFetchResponse(VALID_RESPONSE));
      vi.stubGlobal("fetch", fetchMock);
      const { useExchangeRate: freshHook } = await import("./useExchangeRate");

      const { result: r2 } = renderHook(() => freshHook());
      await waitFor(() =>
        expect(r2.current.status).toBe<ExchangeRateStatus>("success"),
      );
      expect(r2.current.rate).toBe(1.38);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup (cancelled flag)
  // -------------------------------------------------------------------------

  describe("cleanup", () => {
    it("does not update state after the component unmounts", async () => {
      let resolveRequest!: (r: Response) => void;
      fetchMock.mockReturnValueOnce(
        new Promise<Response>((res) => {
          resolveRequest = res;
        }),
      );

      const { result, unmount } = renderHook(() => useExchangeRate());

      expect(result.current.status).toBe<ExchangeRateStatus>("loading");

      // The cleanup callback sets `cancelled = true`.
      unmount();

      // Resolve after unmount — the cancelled guard should prevent state change.
      resolveRequest(makeFetchResponse(VALID_RESPONSE));
      await new Promise((r) => setTimeout(r, 0));

      expect(result.current.status).toBe<ExchangeRateStatus>("loading");
      expect(result.current.rate).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Request URL
  // -------------------------------------------------------------------------

  describe("request URL", () => {
    it("fetches from the /api/frankfurter Vite proxy path", async () => {
      fetchMock.mockResolvedValueOnce(makeFetchResponse(VALID_RESPONSE));

      const { result } = renderHook(() => useExchangeRate());
      await waitFor(() =>
        expect(result.current.status).toBe<ExchangeRateStatus>("success"),
      );

      const calledUrl = fetchMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("/api/frankfurter");
      expect(calledUrl).toContain("from=USD");
      expect(calledUrl).toContain("to=CAD");
    });
  });
});
