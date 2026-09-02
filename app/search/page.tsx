import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import { ensureSeeded } from "@/lib/ensure-seed";
import { getAllListings } from "@/lib/kv";
import { DESTINATIONS } from "@/lib/fixtures";
import type { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    destination?: string;
    amenity?: string;
    freeCancellation?: string;
    guests?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  await ensureSeeded();
  const allListings = await getAllListings();

  let listings = allListings;
  if (params.destination) {
    listings = listings.filter((l) => l.destination === params.destination);
  }
  if (params.amenity) {
    listings = listings.filter((l) => l.amenities.includes(params.amenity as Listing["amenities"][number]));
  }
  if (params.freeCancellation === "1") {
    listings = listings.filter((l) => l.freeCancellation);
  }
  if (params.guests) {
    const g = Number(params.guests);
    if (!Number.isNaN(g)) listings = listings.filter((l) => l.maxGuests >= g);
  }

  const destinationLabel = DESTINATIONS.find((d) => d.id === params.destination)?.label;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SearchBar compact />

      <div className="mt-8 mb-4 flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-bold text-ink-900">
          {destinationLabel ? `Alojamientos en ${destinationLabel}` : "Todos los alojamientos"}
        </h1>
        <p className="text-sm text-ink-700">{listings.length} resultados</p>
      </div>

      {listings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center text-ink-700">
          No hay alojamientos que coincidan con tu búsqueda. Prueba con otros filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
