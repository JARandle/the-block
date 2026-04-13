import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * milliseconds have elapsed since the last change. Useful for deferring
 * expensive operations (e.g. filtering a list) until the user stops typing.
 *
 * @param value   - The value to debounce.
 * @param delayMs - How long to wait (in milliseconds) after the last change
 *                  before committing the new value.
 * @returns The debounced value, which lags behind `value` by up to `delayMs`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
