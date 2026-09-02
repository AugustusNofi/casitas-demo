"use client";

import { useState } from "react";
import { useBookings } from "@/app/providers";
import { formatMoney } from "@/lib/pricing";
import type { Booking } from "@/lib/types";

export default function AdminBookingActions({ booking }: { booking: Booking }) {
  const { runScheduledBalanceCharge, releaseHold, captureHold, refundBooking } = useBookings();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [damageAmount, setDamageAmount] = useState(String(booking.securityDepositAmount || 250));
  const [refundAmount, setRefundAmount] = useState(
    String(booking.transactionIds.sale ? booking.totalAmount : booking.depositAmount || 0)
  );

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    setBusy(true);
    setMessage(null);
    const { ok, error } = await action();
    setMessage(
      ok
        ? successMsg
        : error === "nuvei_not_configured"
        ? "Las credenciales de Nuvei no están configuradas en el servidor."
        : `Error: ${error || "desconocido"}`
    );
    setBusy(false);
  }

  const canRunScheduledCharge = booking.status === "deposit_paid" && booking.userPaymentOptionId;
  const canReleaseOrClaimHold = booking.status === "hold_active";
  const canRefund = booking.transactionIds.sale || booking.transactionIds.deposit;

  return (
    <div className="space-y-4">
      {canRunScheduledCharge && (
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <p className="text-sm font-semibold text-ink-900">Flujo 2 — Cobrar saldo restante</p>
          <p className="mt-1 text-xs text-ink-700">
            Simula que ha llegado la fecha programada y cobra{" "}
            {formatMoney(booking.balanceAmount || 0, booking.currency)} a la tarjeta guardada
            (userPaymentOptionId: <span className="font-mono">{booking.userPaymentOptionId}</span>), sin
            pedirla de nuevo.
          </p>
          <button
            disabled={busy}
            onClick={() => run(() => runScheduledBalanceCharge(booking.id), "Saldo cobrado correctamente.")}
            className="mt-3 rounded-full bg-teal-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            Simular: ejecutar cobro programado
          </button>
        </div>
      )}

      {canReleaseOrClaimHold && (
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <p className="text-sm font-semibold text-ink-900">Flujo 3 — Fianza de seguridad</p>
          <p className="mt-1 text-xs text-ink-700">
            Retención activa de {formatMoney(booking.securityDepositAmount || 0, booking.currency)} (txn{" "}
            <span className="font-mono">{booking.holdTransactionId}</span>). Libérala o reclama daños con
            una captura parcial.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              disabled={busy}
              onClick={() => run(() => releaseHold(booking.id), "Fianza liberada.")}
              className="rounded-full border border-teal-600 px-4 py-2 text-xs font-bold text-teal-700 disabled:opacity-60"
            >
              Liberar fianza (void)
            </button>
            <input
              type="number"
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              className="w-24 rounded-full border border-sand-200 px-3 py-2 text-xs"
            />
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => captureHold(booking.id, Number(damageAmount)),
                  "Daños reclamados (captura parcial)."
                )
              }
              className="rounded-full bg-coral-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              Reclamar daños (captura)
            </button>
          </div>
        </div>
      )}

      {canRefund && (
        <div className="rounded-2xl border border-sand-200 bg-white p-4">
          <p className="text-sm font-semibold text-ink-900">Flujo 4 — Reembolso manual</p>
          <p className="mt-1 text-xs text-ink-700">Anula el pago total o parcialmente, al margen de la política de cancelación.</p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-28 rounded-full border border-sand-200 px-3 py-2 text-xs"
            />
            <button
              disabled={busy}
              onClick={() =>
                run(
                  () => refundBooking(booking.id, Number(refundAmount)),
                  "Reembolso procesado."
                )
              }
              className="rounded-full border border-coral-500 px-4 py-2 text-xs font-bold text-coral-600 disabled:opacity-60"
            >
              Procesar reembolso
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-xs font-medium text-ink-900">{message}</p>}
    </div>
  );
}
