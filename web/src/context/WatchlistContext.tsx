import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "the-block-watchlist";

/**
 * Reads the persisted watchlist from `localStorage` and returns the vehicle
 * IDs as a `Set`. Returns an empty set if the key is absent or the stored
 * value is malformed.
 */
function loadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

/**
 * Persists the current watchlist ID set to `localStorage`. Any write errors
 * (e.g. quota exceeded) are silently ignored.
 *
 * @param ids - The set of watchlisted vehicle IDs to persist.
 */
function saveIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

type WatchlistContextValue = {
  ids: ReadonlySet<string>;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

/**
 * Context provider that manages the user's watchlist (saved vehicles).
 * State is initialised from `localStorage` on mount and automatically
 * persisted whenever it changes.
 *
 * Wrap your component tree with this provider to make
 * {@link useWatchlistContext} available to descendants.
 */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() =>
    typeof window === "undefined" ? new Set() : loadIds()
  );

  useEffect(() => {
    saveIds(ids);
  }, [ids]);

  /**
   * Adds the vehicle ID to the watchlist if it is not currently saved, or
   * removes it if it is. The updated set is automatically persisted to
   * `localStorage` via the effect above.
   *
   * @param id - The vehicle UUID to add or remove.
   */
  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Returns `true` if the given vehicle ID is currently in the watchlist.
   *
   * @param id - The vehicle UUID to check.
   */
  const has = useCallback((id: string) => ids.has(id), [ids]);

  const value = useMemo(
    () => ({
      ids,
      toggle,
      has,
    }),
    [ids, toggle, has]
  );

  return (
    <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
  );
}

/**
 * Returns the nearest {@link WatchlistContext} value. Must be called inside a
 * component tree that is wrapped by {@link WatchlistProvider}.
 *
 * @throws {Error} If no `WatchlistProvider` ancestor is present.
 */
export function useWatchlistContext(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlistContext requires WatchlistProvider");
  return ctx;
}
