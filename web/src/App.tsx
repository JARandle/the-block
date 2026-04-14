import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { VehiclesProvider } from "./context/VehiclesContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import { Header } from "./components/Header";
import { SkeletonCard } from "./components/SkeletonCard";

const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
const VehicleDetailPage = lazy(() =>
  import("./pages/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage }))
);

const suspenseFallback = (
  <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

/**
 * Root application component. Sets up client-side routing via
 * `BrowserRouter` and wraps the entire tree with the
 * {@link VehiclesProvider} and {@link WatchlistProvider} context providers.
 *
 * Defined routes:
 * - `/`              → {@link InventoryPage}
 * - `/vehicle/:id`   → {@link VehicleDetailPage}
 * - `*`              → redirects to `/`
 *
 * Also renders a keyboard-accessible "Skip to content" link for screen reader
 * and keyboard users.
 */
export default function App() {
  return (
    <BrowserRouter>
      <VehiclesProvider>
        <WatchlistProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-slate-950"
          >
            Skip to content
          </a>
          <div className="min-h-screen bg-slate-950 text-slate-200">
            <Header />
            <main id="main-content">
              <Suspense fallback={suspenseFallback}>
                <Routes>
                  <Route path="/" element={<InventoryPage />} />
                  <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </WatchlistProvider>
      </VehiclesProvider>
    </BrowserRouter>
  );
}
