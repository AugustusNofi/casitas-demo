"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "./CurrencyProvider";
import { convertFromEur, formatMoney } from "@/lib/pricing";
import type { Listing } from "@/lib/types";

function defaultDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function BookingWidget({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [checkIn, setCheckIn] = useState(defaultDate(21));
  const [checkOut, setCheckOut] = useState(defaultDate(26));
  const [guests, setGuests] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nights = useMemo(() => {
    const diff = Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(1, diff);
  }, [checkIn, checkOut]);

  const totalEur = nights * listing.pricePerNightEur;

  async function handleReserve(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName || !guestEmail) {
      setError("Indica tu nombre y correo electrónico para continuar.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn,
          checkOut,
          guests,
          guestName,
          guestEmail,
          currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear la reserva");
      router.push(`/checkout/${data.booking.id}`);
    } catch {
      setError("Ha ocurrido un error al crear la reserva. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleReserve}
      className="sticky top-24 rounded-3xl border border-sand-200 bg-white p-5 shadow-lg"
    >
      <p className="font-display text-2xl font-bold text-ink-900">
        {formatMoney(convertFromEur(listing.pricePerNightEur, currency), currency)}
        <span className="text-sm font-normal text-ink-700"> / noche</span>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="rounded-xl border border-sand-200 p-2">
          <span className="text-[11px] font-semibold uppercase text-ink-700">Entrada</span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="block w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label className="rounded-xl border border-sand-200 p-2">
          <span className="text-[11px] font-semibold uppercase text-ink-700">Salida</span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="block w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <label className="mt-2 block rounded-xl border border-sand-200 p-2">
        <span className="text-[11px] font-semibold uppercase text-ink-700">Huéspedes</span>
        <input
          type="number"
          min={1}
          max={listing.maxGuests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="block w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <input
          type="text"
          placeholder="Tu nombre completo"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="rounded-xl border border-sand-200 p-2 text-sm outline-none focus:border-teal-500"
        />
        <input
          type="email"
          placeholder="Tu correo electrónico"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="rounded-xl border border-sand-200 p-2 text-sm outline-none focus:border-teal-500"
        />
      </div>

      <div className="mt-4 space-y-1 border-t border-sand-200 pt-3 text-sm text-ink-700">
        <div className="flex justify-between">
          <span>
            {formatMoney(convertFromEur(listing.pricePerNightEur, currency), currency)} x {nights} noches
          </span>
          <span>{formatMoney(convertFromEur(totalEur, currency), currency)}</span>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold text-ink-900">
          <span>Total</span>
          <span>{formatMoney(convertFromEur(totalEur, currency), currency)}</span>
        </div>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-coral-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-full bg-coral-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600 disabled:opacity-60"
      >
        {submitting ? "Creando reserva…" : "Reservar"}
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-700">No se te cobrará todavía</p>
    </form>
  );
}
