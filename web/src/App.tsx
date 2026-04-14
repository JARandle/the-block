import { Component, lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { VehiclesProvider } from "./context/VehiclesContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import { Header } from "./components/Header";

const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
const VehicleDetailPage = lazy(() =>
  import("./pages/VehicleDetailPage").then((m) => ({ default: m.VehicleDetailPage }))
);

/**
 * React error boundary that catches render-time exceptions thrown by any
 * descendant component — including lazily loaded route chunks — and renders a
 * recoverable full-page error UI instead of leaving the screen blank.
 *
 * Must be a class component because React does not support error boundary
 * lifecycle methods (`getDerivedStateFromError`, `componentDidCatch`) in
 * function components.
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err: unknown) {
    return {
      hasError: true,
      message: err instanceof Error ? err.message : "An unexpected error occurred.",
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
          <div className="max-w-md rounded-2xl border border-red-900/50 bg-red-950/30 p-8 text-center">
            <h1 className="font-display text-xl font-semibold text-white">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-slate-400">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-amber-500 px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
 * and keyboard users. An {@link ErrorBoundary} wraps the route tree so that
 * render errors surface a recoverable UI instead of a blank screen.
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
              <ErrorBoundary>
                <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
                  <Routes>
                    <Route path="/" element={<InventoryPage />} />
                    <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </WatchlistProvider>
      </VehiclesProvider>
    </BrowserRouter>
  );
}
