import { Link } from "react-router-dom";

/**
 * Sticky site-wide header containing the application logo/home link, a
 * short tagline, and a navigation link back to the inventory listing.
 */
export function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 rounded"
        >
          The Block
        </Link>
        <p className="hidden text-sm text-slate-400 sm:block">
          Buyer auctions — browse, inspect, bid
        </p>
        <Link
          to="/"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
        >
          Inventory
        </Link>
      </div>
    </header>
  );
}
