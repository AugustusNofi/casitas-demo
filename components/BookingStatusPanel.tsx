"use client";

import { useState } from "react";
import NuveiCheckout, { type NuveiResult } from "./NuveiCheckout";
import Timeline from "./Timeline";
import { useBookings } from "@/app/providers";
import { formatMoney } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

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

export default function BookingStatusPanel({ bookingId }: { bookingId: string }) {
  const { getBooking, getTimeline, placeHold, cancelBooking } = useBookings();
  const booking = getBooking(bookingId);
  const timeline = getTimeline(bookingId);
  const [showHoldWidget, setShowHoldWidget] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<string | null>(null);

  if (!booking) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-6 text-ink-700">
        No se encuentra esta reserva en esta sesión del navegador.
      </div>
    );
  }
  // Re-bind to a const so closures below keep the narrowed (non-undefined) type —
  // TS doesn't propagate narrowing of `booking` into function declarations on its own.
  const b = booking;

  async function handleCancel() {
    if (!confirm("¿Seguro que quieres cancelar esta reserva?")) return;
    setCancelling(true);
    setCancelResult(null);
    const res = await cancelBooking(bookingId);
    if (!res.ok) {
      setCancelResult(
        res.error === "nuvei_not_configured"
          ? "Las credenciales de Nuvei no están configuradas en el servidor."
          : "No se pudo procesar la cancelación."
      );
    } else if (res.refundAmount) {
      setCancelResult(
        res.withinFreeWindow
          ? `Reembolso completo procesado: ${formatMoney(res.refundAmount, b.currency)}`
          : `Reembolso parcial procesado (${b.cancellationPolicyPct}%): ${formatMoney(res.refundAmount, b.currency)}`
      );
    } else {
      setCancelResult("Reserva cancelada.");
    }
    setCancelling(false);
  }

  function handleHoldResult(result: NuveiResult) {
    if (result.result === "APPROVED") {
      placeHold(bookingId, result);
      setShowHoldWidget(false);
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
                  amountEur={booking.securityDepositAmount || 250}
                  currency={booking.currency}
                  transactionType="Auth"
                  userTokenId={`${booking.id}-hold`}
                  onResult={handleHoldResult}
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
