"use client";

import Link from "next/link";
import { useBookings } from "@/app/providers";
import { formatMoney } from "@/lib/pricing";

const STATUS_LABEL: Record<string, string> = {
  paid_in_full: "Pago completo confirmado",
  deposit_paid: "Depósito del 30% confirmado",
  hold_active: "Fianza retenida",
  pending: "Pago pendiente",
};

export default function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const { getBooking } = useBookings();
  const booking = getBooking(bookingId);

  if (!booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-ink-700">
        No se encuentra esta reserva en esta sesión del navegador.
      </div>
    );
  }

  const mainTxn =
    booking.transactionIds.sale || booking.transactionIds.deposit || booking.transactionIds.hold;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-3xl">
        ✓
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
        {STATUS_LABEL[booking.status] || "Reserva actualizada"}
      </h1>
      <p className="mt-2 text-ink-700">
        {booking.listingTitle} · {new Date(booking.checkIn).toLocaleDateString("es-ES")} →{" "}
        {new Date(booking.checkOut).toLocaleDateString("es-ES")}
      </p>

      <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-5 text-left text-sm">
        <div className="flex justify-between border-b border-sand-100 py-1.5">
          <span className="text-ink-700">Reserva</span>
          <span className="font-mono font-semibold">{booking.id}</span>
        </div>
        {mainTxn && (
          <div className="flex justify-between border-b border-sand-100 py-1.5">
            <span className="text-ink-700">ID de transacción Nuvei</span>
            <span className="font-mono font-semibold">{mainTxn}</span>
          </div>
        )}
        <div className="flex justify-between py-1.5">
          <span className="text-ink-700">Total de la estancia</span>
          <span className="font-semibold">{formatMoney(booking.totalAmount, booking.currency)}</span>
        </div>
      </div>

      <Link
        href={`/booking/${booking.id}`}
        className="mt-6 inline-block rounded-full bg-coral-500 px-6 py-2.5 text-sm font-bold text-white"
      >
        Ver mi reserva
      </Link>
    </div>
  );
}
