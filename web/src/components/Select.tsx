import type { SelectHTMLAttributes } from "react";

const baseClass =
  "mt-1 min-h-[48px] w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-base text-white focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-400/40";

/**
 * Styled `<select>` element pre-wired with the inventory filter appearance.
 * Accepts all native `<select>` props plus an optional `className` for
 * width/min-width overrides.
 */
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${baseClass} ${className}`.trimEnd()} {...props}>
      {children}
    </select>
  );
}
