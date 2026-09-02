"use client";

import Link from "next/link";
import { useBookings } from "@/app/providers";
import { formatMoney } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

const STATUS_STYLE: Record<Booking["status"], string> = {
  pending: "bg-sand-200 text-ink-700",
  deposit_paid: "bg-coral-100 text-coral-700",
  paid_in_full: "bg-teal-100 text-teal-700",
  hold_active: "bg-yellow-100 text-yellow-800",
  hold_released: "bg-sand-200 text-ink-700",
  hold_claimed: "bg-orange-100 text-orange-800",
  refunded: "bg-red-100 text-red-700",
  partially_refunded: "bg-red-50 text-red-600",
  cancelled: "bg-sand-200 text-ink-700",
};

const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Pendiente",
  deposit_paid: "Depósito pagado",
  paid_in_full: "Pagado en su totalidad",
  hold_active: "Fianza activa",
  hold_released: "Fianza liberada",
  hold_claimed: "Fianza reclamada",
  refunded: "Reembolsada",
  partially_refunded: "Reembolso parcial",
  cancelled: "Cancelada",
};

export default function AdminBookingsPage() {
  const { bookings } = useBookings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">Reservas</h1>
      <p className="text-sm text-ink-700">{bookings.length} reservas en total (en esta sesión del navegador)</p>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-sand-200 bg-sand-50 text-xs uppercase text-ink-700">
            <tr>
              <th className="px-4 py-3">Reserva</th>
              <th className="px-4 py-3">Huésped</th>
              <th className="px-4 py-3">Fechas</th>
              <th className="px-4 py-3">Importe</th>
              <th className="px-4 py-3">Flujo</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-sand-100 last:border-0 hover:bg-sand-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs font-semibold text-teal-700 hover:underline">
                    {b.id}
                  </Link>
                  <p className="text-xs text-ink-700">{b.listingTitle}</p>
                </td>
                <td className="px-4 py-3">{b.guestName}</td>
                <td className="px-4 py-3 text-xs">
                  {new Date(b.checkIn).toLocaleDateString("es-ES")} →{" "}
                  {new Date(b.checkOut).toLocaleDateString("es-ES")}
                </td>
                <td className="px-4 py-3 font-semibold">{formatMoney(b.totalAmount, b.currency)}</td>
                <td className="px-4 py-3 text-xs capitalize">{b.flow.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[b.status]}`}>
                    {STATUS_LABEL[b.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
