# The Block — Buyer auction prototype

Submission README for the OPENLANE coding challenge.

---

## How to Run

The buyer UI lives in [`web/`](web/). You need **Node.js 18+** (16+ may work; the stack uses Vite 4 and Vitest).

1. Clone the repo and open a terminal at the repo root.

2. Install dependencies and start the dev server:

   ```bash
   cd web
   npm install
   npm run dev
   ```

3. Open the URL shown in the terminal.

**Implementation note:** The app loads inventory from [`web/public/vehicles.json`](web/public/vehicles.json) (a copy of the challenge dataset) via `fetch("/vehicles.json")`, so the Vite dev server or any static host can run it without a custom API.

---

## Time Spent

3 hours on minimum bar requirements: buyer inventory and detail flows, bidding rules with browser persistence, search/sort/watchlist, basic accessibility touches, and automated tests.

2-3 hours on stretch goals: Optimization for web/mobile browser, optimal lighthouse score. Advanced vehicle filtering and bug fixes.

---

## Assumptions and Scope

**Included**

- **Frontend-only** buyer experience: browse ~200 vehicles, search, sort, optional “saved only” filter.
- **Vehicle detail** with specs, condition, damage notes, dealership, image gallery, auction summary, and bid panel.
- **Bidding** with validation; successful bids update current bid and bid count everywhere the listing appears.
- **Persistence:** bid updates in `localStorage` (`the-block-bid-overrides`); saved vehicles in `localStorage` (`the-block-watchlist`).
- **Auction timing:** synthetic `auction_start` values compared to the browser clock for countdown copy (“Starts in …” / “Auction in progress”) and formatted start time on cards and detail.
- **Reserve:** “reserve met” when `current_bid >= reserve_price` (demo clarity).

---

## Stack

- **Frontend:** React 18, Vite 4, TypeScript, React Router 6, Tailwind CSS 3.
- **Backend:** None (static JSON + client-side state).
- **Database:** None (`localStorage` for overrides and watchlist).

## LLMS
- **IDE:** Cursor.
- **LLMS** Planning stage - Cursor - Composer 2. Building stage - Cursor - Composer 2. Code review/optimization - Sonnet 4.6
---

## What I Built

An auction buyer app with two main routes: inventory (`/`) and vehicle detail (`/vehicle/:id`). The inventory page loads vehicles from static JSON, shows a responsive grid of cards (thumbnail, title, location/lot, current bid, auction start time + countdown), and provides a debounced search across make, model, trim, VIN, lot, city, province, dealership, body style, and year. Users can sort by auction start (soonest), current bid (high to low), year (newest), or listing order, and toggle Saved only using per-card save actions.

Inventory also exposes dropdown filters for Year, Make, and Model. The Make and Model filters are built dynamically from the loaded dataset via [`web/src/lib/inventoryFilters.ts`](web/src/lib/inventoryFilters.ts) (`buildVehicleFilterIndex`). The Model dropdown is disabled until a Make is selected and automatically clears if the chosen make no longer has the selected model. Results are loaded at 12 per page with a "Load more" button that shows the remaining count; any filter or sort change resets back to the first page.

A potential profit for the buyer is also listed. This number is based off the difference in the buy now option and the current winning bid. Vehicles without a buy now option notify the buyer the information is not available.

Inventory cards use skeleton placeholders while the JSON fetch is in flight, giving instant visual feedback on slow connections.

The detail page adds full specs, condition narrative, BidPanel (minimum next bid, validation messages, success feedback), buy-now price (shown only when present in the dataset), and auction metadata consistent with the dataset. The document `<title>` is updated to the vehicle name while the detail page is mounted and restored on unmount. A breadcrumb links back to inventory. A skip-to-content link and focus styles support keyboard users. Unknown routes redirect to inventory.

---

## Notable Decisions

- **Bid rules:** Minimum next bid is the starting bid when `bid_count === 0`; after bids exist, the next bid must beat the current high by $100 (`BID_INCREMENT` in [`web/src/lib/bid.ts`](web/src/lib/bid.ts)). This keeps the prototype predictable and easy to test.
- **State model:** Catalog stays immutable in memory; `localStorage` stores only overrides for `current_bid` and `bid_count`, merged when rendering. Watchlist is a separate set of vehicle IDs.
- **Synthetic auction times:** Countdowns and “in progress” are derived from now vs. ISO `auction_start`, matching the README assumption that scheduling data can be interpreted relative to the prototype session.
- **Cards show both** formatted start time and countdown/live label so users always see the scheduled time, not only relative text.
- **Filter index:** `buildVehicleFilterIndex` does a single pass over the inventory to produce sorted, de-duped year/make/model option lists. The Model list is scoped per make (a `Map<string, string[]>`), so the dropdown is always coherent with the active Make selection. The full filter + sort pipeline lives in `filterAndSortInventory`, keeping `InventoryPage` free of imperative filter logic.
- **Tooling:** Vitest for fast unit tests on search, bid, format, and filter logic; Playwright for a short smoke suite that boots the dev server via config.

---

## Testing

- **Unit (Vitest):** Run from `web/` with `npm run test` (or `npm run test:watch` during development).
  - [`web/src/lib/search.test.ts`](web/src/lib/search.test.ts) — `matchesSearch` and `sortVehicles`.
  - [`web/src/lib/bid.test.ts`](web/src/lib/bid.test.ts) — `nextMinimumBid`, `validateBidAmount`, `applySuccessfulBid`.
  - [`web/src/lib/format.test.ts`](web/src/lib/format.test.ts) — `formatCurrency`, `formatDateTime`, `auctionCountdownLabel` (full boundary coverage including "Starting soon", hours+minutes, and days thresholds).
  - [`web/src/lib/inventoryFilters.test.ts`](web/src/lib/inventoryFilters.test.ts) — `buildVehicleFilterIndex` (deduplication, sorting) and `filterAndSortInventory` (every filter/sort combination, edge cases).
- **E2E (Playwright):** From `web/`, install browsers once with `npx playwright install chromium`, then `npm run test:e2e`. Config starts `npm run dev` automatically ([`web/playwright.config.cjs`](web/playwright.config.cjs)).
  - [`web/e2e/smoke.spec.mjs`](web/e2e/smoke.spec.mjs) — inventory loads, open a vehicle (detail + bid heading), search shows empty state then restores results.

---

## What I'd Do With More Time

- Real API and authenticated sessions; server-side bid validation and concurrency control.
- Live updates and auction end times / winner state.
- Richer filters (price band, province, condition grade).
- Image handling beyond placeholders.
- More detailed profit value function (currency conversion, profit margin based off most recent sale price)

---


