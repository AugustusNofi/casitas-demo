"use client";

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { useCurrency } from "./CurrencyProvider";
import { convertFromEur, formatMoney } from "@/lib/pricing";

const AMENITY_LABEL: Record<Listing["amenities"][number], string> = {
  pool: "Piscina",
  "pet-friendly": "Admite mascotas",
  "sea-view": "Vistas al mar",
  wifi: "Wifi",
  kitchen: "Cocina",
  parking: "Parking",
};

export default function PropertyCard({ listing }: { listing: Listing }) {
  const { currency } = useCurrency();
  const price = formatMoney(convertFromEur(listing.pricePerNightEur, currency), currency);

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group block overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        {listing.freeCancellation && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-teal-700 shadow">
            Cancelación gratuita
          </span>
        )}
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-semibold text-white">
          ★ {listing.rating.toFixed(1)}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
          {listing.destinationLabel} · {listing.type}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-ink-900">{listing.title}</h3>
        <p className="mt-1 text-xs text-ink-700">
          {listing.amenities.slice(0, 3).map((a) => AMENITY_LABEL[a]).join(" · ")}
        </p>
        <p className="mt-3 text-sm text-ink-700">
          desde <span className="font-display text-lg font-bold text-coral-600">{price}</span> por noche
        </p>
      </div>
    </Link>
  );
}
