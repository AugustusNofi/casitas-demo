"use client";

import { use } from "react";
import { useBookings } from "@/app/providers";
import { formatMoney } from "@/lib/pricing";
import Timeline from "@/components/Timeline";
import AdminBookingActions from "@/components/AdminBookingActions";

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getBooking, getTimeline } = useBookings();
  const booking = getBooking(id);
  const timeline = getTimeline(id);

  if (!booking) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 text-ink-700">
        No se encuentra esta reserva en esta sesión del navegador.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Reserva {booking.id}</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">{booking.listingTitle}</h1>
      <p className="mt-1 text-sm text-ink-700">
        {booking.guestName} ({booking.guestEmail}) ·{" "}
        {new Date(booking.checkIn).toLocaleDateString("es-ES")} →{" "}
        {new Date(booking.checkOut).toLocaleDateString("es-ES")} · {booking.guests} huéspedes
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Total</p>
          <p className="font-semibold">{formatMoney(booking.totalAmount, booking.currency)}</p>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Estado</p>
          <p className="font-semibold">{booking.status}</p>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Flujo</p>
          <p className="font-semibold capitalize">{booking.flow.replace("_", " ")}</p>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Token de red / UPO</p>
          <p className="truncate font-mono text-xs font-semibold">
            {booking.userPaymentOptionId || "—"}
            {booking.cardLast4 && ` (${booking.cardBrand || "tarjeta"} ····${booking.cardLast4})`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-ink-900">Acciones</h2>
          <AdminBookingActions booking={booking} />
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-ink-900">Ciclo de vida del pago</h2>
          <Timeline events={timeline} />
        </div>
      </div>
    </div>
  );
}
