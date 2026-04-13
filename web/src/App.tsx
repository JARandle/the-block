import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { VehiclesProvider } from "./context/VehiclesContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import { Header } from "./components/Header";
import { InventoryPage } from "./pages/InventoryPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";

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
              <Routes>
                <Route path="/" element={<InventoryPage />} />
                <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </WatchlistProvider>
      </VehiclesProvider>
    </BrowserRouter>
  );
}
