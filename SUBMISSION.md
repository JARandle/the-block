# The Block — Buyer auction prototype

Submission README for the OPENLANE coding challenge. When finished, send the link to your repo to your contact at **OPENLANE**.

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

3. Open the URL shown in the terminal (typically [http://localhost:5173](http://localhost:5173)).

**Production build** (from `web/`):

```bash
npm run build
npm run preview
```

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
- **Bidding** with validation; successful bids update **current bid** and **bid count** everywhere the listing appears.
- **Persistence:** bid updates in `localStorage` (`the-block-bid-overrides`); saved vehicles in `localStorage` (`the-block-watchlist`).
- **Auction timing:** synthetic `auction_start` values compared to the browser clock for countdown copy (“Starts in …” / “Auction in progress”) and formatted start time on cards and detail.
- **Reserve:** “reserve met” when `current_bid >= reserve_price` (demo clarity).

**Skipped / out of scope**

- Authentication, seller tools, checkout, payments, real-time multi-user bidding, and backend services.
- No database; no server-side bid validation.

---

## Stack

- **Frontend:** React 18, Vite 4, TypeScript, React Router 6, Tailwind CSS 3.
- **Backend:** None (static JSON + client-side state).
- **Database:** None (`localStorage` for overrides and watchlist).

---

## What I Built

A **single-page-style** auction buyer app with two main routes: inventory (`/`) and vehicle detail (`/vehicle/:id`). The **inventory** page loads vehicles from static JSON, shows a responsive grid of cards (thumbnail, title, location/lot, current bid, auction start time + countdown), and provides a **debounced** search across make, model, trim, VIN, lot, city, province, dealership, body style, and year. Users can **sort** by auction start (soonest), current bid (high to low), year (newest), or listing order, and toggle **Saved only** using per-card save actions.

The **detail** page adds full specs, condition narrative, **BidPanel** (minimum next bid, validation messages, success feedback), and auction metadata consistent with the dataset. A **skip-to-content** link and focus styles support keyboard users. Unknown routes redirect to inventory.

---

## Notable Decisions

- **Bid rules:** Minimum next bid is the **starting bid** when `bid_count === 0`; after bids exist, the next bid must beat the current high by **$100** (`BID_INCREMENT` in [`web/src/lib/bid.ts`](web/src/lib/bid.ts)). This keeps the prototype predictable and easy to test.
- **State model:** Catalog stays immutable in memory; `localStorage` stores only **overrides** for `current_bid` and `bid_count`, merged when rendering. Watchlist is a separate set of vehicle IDs.
- **Synthetic auction times:** Countdowns and “in progress” are derived from **now** vs. ISO `auction_start`, matching the README assumption that scheduling data can be interpreted relative to the prototype session.
- **Cards show both** formatted start time and countdown/live label so users always see the scheduled time, not only relative text.
- **Tooling:** Vitest for fast unit tests on search and bid logic; Playwright for a short **smoke** suite that boots the dev server via config.

**Tradeoffs:** Local-only bids mean no cross-device or anti-sniping behavior; acceptable for the challenge scope.

---

## Testing

- **Unit (Vitest):** Run from `web/` with `npm run test` (or `npm run test:watch` during development).
  - [`web/src/lib/search.test.ts`](web/src/lib/search.test.ts) — `matchesSearch` and `sortVehicles`.
  - [`web/src/lib/bid.test.ts`](web/src/lib/bid.test.ts) — `nextMinimumBid`, `validateBidAmount`, `applySuccessfulBid`.
- **E2E (Playwright):** From `web/`, install browsers once with `npx playwright install chromium`, then `npm run test:e2e`. Config starts `npm run dev` automatically ([`web/playwright.config.cjs`](web/playwright.config.cjs)).
  - [`web/e2e/smoke.spec.mjs`](web/e2e/smoke.spec.mjs) — inventory loads, open a vehicle (detail + bid heading), search shows empty state then restores results.

---

## What I'd Do With More Time

- Real **API** and authenticated sessions; server-side bid validation and concurrency control.
- **Live updates** (polling or WebSockets) and auction end times / winner state.
- Richer **filters** (price band, province, condition grade) and URL-driven search params.
- **Image** handling beyond placeholders (CDN, lazy loading strategy, fallbacks).
- Broader **a11y** audit and visual regression tests.

---


