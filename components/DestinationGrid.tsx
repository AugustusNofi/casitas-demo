import Link from "next/link";
import { DESTINATIONS } from "@/lib/fixtures";

const DESTINATION_IMAGE: Record<string, string> = {
  "costa-brava": "/images/costa-brava-villa-pool.png",
  andalucia: "/images/andalucia-white-village-house.png",
  algarve: "/images/algarve-villa-infinity-pool.png",
  sardinia: "/images/sardinia-villa-pergola.png",
  "greek-islands": "/images/greek-island-cycladic-house.png",
};

export default function DestinationGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {DESTINATIONS.map((d) => (
        <Link
          key={d.id}
          href={`/search?destination=${d.id}`}
          className="group relative aspect-square overflow-hidden rounded-2xl"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DESTINATION_IMAGE[d.id]}
            alt={d.label}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="font-display text-base font-bold text-white">{d.label}</p>
            <p className="text-[11px] text-white/85">{d.blurb}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
