import SearchBar from "@/components/SearchBar";
import PopularSearchPills from "@/components/PopularSearchPills";
import DestinationGrid from "@/components/DestinationGrid";
import PropertyCard from "@/components/PropertyCard";
import HostCtaBanner from "@/components/HostCtaBanner";
import listings from "@/data/listings.json";
import type { Listing } from "@/lib/types";

export default function HomePage() {
  const featured = (listings as Listing[]).filter((l) => l.rating >= 4.8).slice(0, 6);

  return (
    <div>
      <section className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-banner.png"
          alt="Pueblo mediterráneo junto al mar"
          className="h-[420px] w-full object-cover sm:h-[480px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/10 to-sand-50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="font-display max-w-2xl text-3xl font-extrabold text-white drop-shadow sm:text-5xl">
            Encuentra tu próxima casita de vacaciones
          </h1>
          <p className="mt-3 max-w-lg text-sm text-white/90 sm:text-base">
            Apartamentos, villas y casas rurales en España y Europa, con pagos flexibles y
            seguros.
          </p>
          <div className="mt-6 w-full px-2">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-700">
          Búsquedas populares
        </h2>
        <PopularSearchPills />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <h2 className="mb-4 font-display text-2xl font-bold text-ink-900">Explora por destino</h2>
        <DestinationGrid />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-ink-900">Las mejor valoradas</h2>
          <a href="/search" className="text-sm font-semibold text-teal-600 hover:underline">
            Ver todas →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <HostCtaBanner />
      </section>
    </div>
  );
}
