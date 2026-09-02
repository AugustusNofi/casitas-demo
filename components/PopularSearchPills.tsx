import Link from "next/link";

const PILLS = [
  { label: "🏖️ Costa Brava este finde", href: "/search?destination=costa-brava" },
  { label: "🏡 Casas rurales en Andalucía", href: "/search?destination=andalucia" },
  { label: "🐾 Alojamientos con mascotas", href: "/search?amenity=pet-friendly" },
  { label: "🏊 Con piscina privada", href: "/search?amenity=pool" },
  { label: "🌅 Vistas al mar en el Algarve", href: "/search?destination=algarve" },
  { label: "✨ Cancelación gratuita", href: "/search?freeCancellation=1" },
  { label: "🇬🇷 Islas Griegas", href: "/search?destination=greek-islands" },
];

export default function PopularSearchPills() {
  return (
    <div className="pill-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {PILLS.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="shrink-0 rounded-full border border-sand-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm transition hover:border-coral-300 hover:text-coral-600"
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
