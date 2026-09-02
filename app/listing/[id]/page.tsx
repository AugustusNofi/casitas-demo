import { notFound } from "next/navigation";
import { ensureSeeded } from "@/lib/ensure-seed";
import { getListing } from "@/lib/kv";
import BookingWidget from "@/components/BookingWidget";

export const dynamic = "force-dynamic";

const AMENITY_LABEL: Record<string, { label: string; icon: string }> = {
  pool: { label: "Piscina privada", icon: "/images/icon-pool.png" },
  "pet-friendly": { label: "Admite mascotas", icon: "/images/icon-pet-friendly.png" },
  "sea-view": { label: "Vistas al mar", icon: "/images/icon-sea-view.png" },
  wifi: { label: "Wifi de alta velocidad", icon: "/images/icon-wifi.png" },
  kitchen: { label: "Cocina equipada", icon: "/images/icon-kitchen.png" },
  parking: { label: "Parking privado", icon: "/images/icon-parking.png" },
};

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureSeeded();
  const listing = await getListing(id);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
        {listing.destinationLabel} · {listing.type}
      </p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink-900">{listing.title}</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-ink-700">
        <span className="font-semibold text-ink-900">★ {listing.rating.toFixed(1)}</span>
        <span>({listing.reviewCount} reseñas)</span>
        {listing.freeCancellation && (
          <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
            Cancelación gratuita
          </span>
        )}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 overflow-hidden rounded-3xl sm:grid-cols-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="col-span-2 row-span-2 h-full max-h-[420px] w-full object-cover"
        />
        {listing.images.slice(1, 5).map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" className="h-full max-h-[206px] w-full object-cover" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="flex items-center gap-3 border-b border-sand-200 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/host-portrait.jpg"
              alt={listing.hostName}
              className="h-14 w-14 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-ink-900">Anfitrión: {listing.hostName}</p>
              <p className="text-xs text-ink-700">
                Hasta {listing.maxGuests} huéspedes · {listing.bedrooms} habitaciones
              </p>
            </div>
          </div>

          <p className="mt-6 leading-relaxed text-ink-700">{listing.description}</p>

          <h2 className="mt-8 font-display text-xl font-bold text-ink-900">Qué ofrece este alojamiento</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listing.amenities.map((a) => (
              <div key={a} className="flex items-center gap-2 rounded-xl border border-sand-200 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={AMENITY_LABEL[a].icon} alt="" className="h-8 w-8" />
                <span className="text-sm text-ink-700">{AMENITY_LABEL[a].label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-sand-200 bg-white p-5">
            <h2 className="font-display text-lg font-bold text-ink-900">Política de cancelación</h2>
            {listing.freeCancellation ? (
              <p className="mt-1 text-sm text-ink-700">
                Cancelación gratuita hasta 7 días antes de la entrada. Después, se reembolsa el{" "}
                {100 - 50}% del importe pagado.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink-700">
                Este alojamiento no incluye cancelación gratuita. En caso de cancelar, se reembolsa
                el 50% del importe pagado.
              </p>
            )}
          </div>
        </div>

        <BookingWidget listing={listing} />
      </div>
    </div>
  );
}
