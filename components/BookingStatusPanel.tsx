"use client";

import { useState } from "react";
import NuveiCheckout from "./NuveiCheckout";
import Timeline from "./Timeline";
import { formatMoney } from "@/lib/pricing";
import type { Booking, TimelineEvent } from "@/lib/types";

const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Pendiente de pago",
  deposit_paid: "Depósito pagado",
  paid_in_full: "Pagado en su totalidad",
  hold_active: "Fianza retenida",
  hold_released: "Fianza liberada",
  hold_claimed: "Fianza reclamada (daños)",
  refunded: "Reembolsada",
  partially_refunded: "Reembolso parcial",
  cancelled: "Cancelada",
};

export default function BookingStatusPanel({
  booking: initialBooking,
  timeline: initialTimeline,
}: {
  booking: Booking;
  timeline: TimelineEvent[];
}) {
  const [booking, setBooking] = useState(initialBooking);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [showHoldWidget, setShowHoldWidget] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch(`/api/bookings/${booking.id}`);
    const data = await res.json();
    if (data.booking) setBooking(data.booking);
    if (data.timeline) setTimeline(data.timeline);
  }

  async function handleCancel() {
    if (!confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    setCancelling(true);
    setCancelResult(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setCancelResult(data.error === "nuvei_not_configured"
          ? "Las credenciales de Nuvei no están configuradas en el servidor."
          : "No se pudo procesar la cancelación.");
      } else {
        setCancelResult(
          data.withinFreeWindow
            ? `Reembolso completo procesado: ${formatMoney(data.refundAmount, booking.currency)}`
            : `Reembolso parcial procesado (${booking.cancellationPolicyPct}%): ${formatMoney(data.refundAmount, booking.currency)}`
        );
        await refresh();
      }
    } finally {
      setCancelling(false);
    }
  }

  const hasPaid = booking.status === "paid_in_full" || booking.status === "deposit_paid";
  const canCancel = hasPaid;
  const canSimulateCheckIn = hasPaid && booking.status !== "hold_active" && !booking.holdTransactionId;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            {STATUS_LABEL[booking.status]}
          </p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink-900">{booking.listingTitle}</h1>
          <p className="mt-1 text-sm text-ink-700">
            {new Date(booking.checkIn).toLocaleDateString("es-ES")} →{" "}
            {new Date(booking.checkOut).toLocaleDateString("es-ES")} · {booking.guests} huéspedes
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-900">
            Total: {formatMoney(booking.totalAmount, booking.currency)}
          </p>
          {booking.status === "deposit_paid" && (
            <p className="mt-1 text-xs text-ink-700">
              Depósito pagado: {formatMoney(booking.depositAmount || 0, booking.currency)} · Saldo
              pendiente: {formatMoney(booking.balanceAmount || 0, booking.currency)}
              {booking.cardLast4 && <> · tarjeta guardada terminada en {booking.cardLast4}</>}
            </p>
          )}
        </div>

        {canCancel && (
          <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm font-semibold text-ink-900">Cancelar reserva</p>
            <p className="mt-1 text-xs text-ink-700">
              Cancelación gratuita hasta el{" "}
              {new Date(booking.freeCancellationUntil).toLocaleDateString("es-ES")}. Después de esa
              fecha se reembolsa el {booking.cancellationPolicyPct}%.
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-3 rounded-full border border-coral-500 px-4 py-2 text-xs font-bold text-coral-600 transition hover:bg-coral-50 disabled:opacity-60"
            >
              {cancelling ? "Procesando…" : "Cancelar reserva"}
            </button>
            {cancelResult && <p className="mt-2 text-xs text-ink-700">{cancelResult}</p>}
          </div>
        )}

        {canSimulateCheckIn && (
          <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5">
            <p className="text-sm font-semibold text-ink-900">Fianza de seguridad</p>
            <p className="mt-1 text-xs text-ink-700">
              Al hacer el check-in, retenemos una fianza de{" "}
              {formatMoney(booking.securityDepositAmount || 250, booking.currency)} en tu tarjeta
              (autorización, sin cobro). Se libera o se reclama parcialmente al hacer el check-out.
            </p>
            {!showHoldWidget ? (
              <button
                onClick={() => setShowHoldWidget(true)}
                className="mt-3 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
              >
                Simular check-in
              </button>
            ) : (
              <div className="mt-3">
                <NuveiCheckout
                  bookingId={booking.id}
                  mode="security_deposit"
                  currency={booking.currency}
                  onOrderCreated={() => {
                    const poll = setInterval(async () => {
                      const res = await fetch(`/api/bookings/${booking.id}`);
                      const data = await res.json();
                      if (data.booking?.status === "hold_active") {
                        clearInterval(poll);
                        await refresh();
                        setShowHoldWidget(false);
                      }
                    }, 1800);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-ink-900">Historial del pago</h2>
        <Timeline events={timeline} />
      </div>
    </div>
  );
}
