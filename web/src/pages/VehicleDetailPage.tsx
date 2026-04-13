import { Link, useParams } from "react-router-dom";
import { useVehiclesContext } from "../context/VehiclesContext";
import { useWatchlistContext } from "../context/WatchlistContext";
import { ImageGallery } from "../components/ImageGallery";
import { BidPanel } from "../components/BidPanel";
import { formatCurrency, formatDateTime, auctionCountdownLabel } from "../lib/format";

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getVehicle, loading, error } = useVehiclesContext();
  const { has, toggle } = useWatchlistContext();
  const vehicle = id ? getVehicle(id) : undefined;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-red-300" role="alert">
          {error}
        </p>
        <Link to="/" className="mt-4 inline-block text-amber-400 hover:underline">
          Back to inventory
        </Link>
      </div>
    );
  }

  if (!loading && !vehicle) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-white">Not found</h1>
        <p className="mt-2 text-slate-400">This vehicle is not in the catalog.</p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-[44px] items-center text-amber-400 hover:underline"
        >
          Back to inventory
        </Link>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const reserveMet = vehicle.current_bid >= vehicle.reserve_price;
  const saved = has(vehicle.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-amber-400 focus:outline-none focus-visible:text-amber-400">
          Inventory
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-slate-300">{title}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div>
          <ImageGallery
            images={vehicle.images}
            alt={`${title} ${vehicle.trim}`}
          />
          <header className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-amber-400/90">
                  Lot {vehicle.lot}
                </p>
                <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-1 text-lg text-slate-400">{vehicle.trim}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(vehicle.id)}
                className={`min-h-[44px] shrink-0 rounded-xl border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 ${
                  saved
                    ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
                    : "border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                }`}
                aria-pressed={saved}
              >
                {saved ? "Saved" : "Save vehicle"}
              </button>
            </div>
          </header>

          <section className="mt-10" aria-labelledby="auction-heading">
            <h2 id="auction-heading" className="font-display text-lg font-semibold text-white">
              Auction
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Starts</dt>
                <dd className="mt-1 text-white">{formatDateTime(vehicle.auction_start)}</dd>
                <dd className="mt-1 text-sm text-slate-400">
                  {auctionCountdownLabel(vehicle.auction_start)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Starting bid</dt>
                <dd className="mt-1 font-semibold tabular-nums text-white">
                  {formatCurrency(vehicle.starting_bid)}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <dt className="text-xs uppercase tracking-wide text-slate-500">Reserve</dt>
                <dd className="mt-1 font-semibold tabular-nums text-white">
                  {formatCurrency(vehicle.reserve_price)}
                </dd>
                <dd className="mt-1 text-sm text-slate-400">
                  {reserveMet ? "Reserve met" : "Reserve not yet met"}
                </dd>
              </div>
              {vehicle.buy_now_price != null ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Buy now</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-emerald-300">
                    {formatCurrency(vehicle.buy_now_price)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="mt-10" aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="font-display text-lg font-semibold text-white">
              Specifications
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Spec k="Body style" v={vehicle.body_style} />
              <Spec k="Engine" v={vehicle.engine} />
              <Spec k="Transmission" v={vehicle.transmission} />
              <Spec k="Drivetrain" v={vehicle.drivetrain} />
              <Spec k="Fuel" v={vehicle.fuel_type} />
              <Spec k="Odometer" v={`${vehicle.odometer_km.toLocaleString("en-CA")} km`} />
              <Spec k="Exterior" v={vehicle.exterior_color} />
              <Spec k="Interior" v={vehicle.interior_color} />
              <Spec k="VIN" v={vehicle.vin} className="sm:col-span-2 font-mono text-sm" />
            </dl>
          </section>

          <section className="mt-10" aria-labelledby="condition-heading">
            <h2 id="condition-heading" className="font-display text-lg font-semibold text-white">
              Condition
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Grade:{" "}
              <span className="font-medium text-slate-200">{vehicle.condition_grade}</span> ·
              Title:{" "}
              <span className="font-medium text-slate-200 capitalize">{vehicle.title_status}</span>
            </p>
            <p className="mt-4 text-slate-300 leading-relaxed">{vehicle.condition_report}</p>
            {vehicle.damage_notes.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-400">Damage notes</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                  {vehicle.damage_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No damage notes reported.</p>
            )}
          </section>

          <section className="mt-10" aria-labelledby="seller-heading">
            <h2 id="seller-heading" className="font-display text-lg font-semibold text-white">
              Selling dealership
            </h2>
            <p className="mt-2 text-lg text-white">{vehicle.selling_dealership}</p>
            <p className="text-slate-400">
              {vehicle.city}, {vehicle.province}
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <BidPanel vehicle={vehicle} />
        </aside>
      </div>
    </div>
  );
}

function Spec({
  k,
  v,
  className = "",
}: {
  k: string;
  v: string;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 ${className}`}>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="text-sm font-medium text-slate-100 capitalize">{v}</dd>
    </div>
  );
}
