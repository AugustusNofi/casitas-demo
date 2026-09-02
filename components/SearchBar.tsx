"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DESTINATIONS } from "@/lib/fixtures";

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkin", checkIn);
    if (checkOut) params.set("checkout", checkOut);
    params.set("guests", String(guests));
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto grid w-full grid-cols-1 items-stretch gap-2 rounded-2xl bg-white p-2 shadow-xl sm:grid-cols-[1.3fr_1fr_1fr_0.9fr_auto] ${
        compact ? "max-w-4xl" : "max-w-3xl"
      }`}
    >
      <label className="flex flex-col justify-center rounded-xl px-3 py-2 hover:bg-sand-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Destino</span>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="bg-transparent text-sm font-medium text-ink-900 outline-none"
        >
          <option value="">Cualquier destino</option>
          {DESTINATIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col justify-center rounded-xl px-3 py-2 hover:bg-sand-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Entrada</span>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="bg-transparent text-sm font-medium text-ink-900 outline-none"
        />
      </label>

      <label className="flex flex-col justify-center rounded-xl px-3 py-2 hover:bg-sand-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Salida</span>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="bg-transparent text-sm font-medium text-ink-900 outline-none"
        />
      </label>

      <label className="flex flex-col justify-center rounded-xl px-3 py-2 hover:bg-sand-50">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-700">Huéspedes</span>
        <input
          type="number"
          min={1}
          max={16}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="bg-transparent text-sm font-medium text-ink-900 outline-none"
        />
      </label>

      <button
        type="submit"
        className="rounded-xl bg-coral-500 px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600"
      >
        Buscar
      </button>
    </form>
  );
}
