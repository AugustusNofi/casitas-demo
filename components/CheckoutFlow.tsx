"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NuveiWebSdkCheckout, { type WebSdkResult } from "./NuveiWebSdkCheckout";
import { useCurrency } from "./CurrencyProvider";
import { useBookings } from "@/app/providers";
import { convertFromEur, formatMoney } from "@/lib/pricing";

export default function CheckoutFlow({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const { getBooking, confirmFullPayment, payDeposit } = useBookings();
  const booking = getBooking(bookingId);
  const [payMode, setPayMode] = useState<"instant" | "deposit">("instant");
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Checkout uses the currency the booking was created with, so the price shown here
  // matches what's actually sent to Nuvei — switching the nav currency mid-checkout
  // would desync the two, so we pin it once on mount.
  useEffect(() => {
    if (booking && currency !== booking.currency) setCurrency(booking.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.currency]);

  if (!booking) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-6 text-ink-700">
        No se encuentra esta reserva en esta sesión del navegador. Empieza una nueva reserva
        desde la búsqueda.
      </div>
    );
  }

  if (booking.status !== "pending") {
    return (
      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-6 text-teal-800">
        Esta reserva ya tiene un pago registrado (estado: <strong>{booking.status}</strong>).{" "}
        <a href={`/booking/${booking.id}`} className="underline">
          Ver reserva
        </a>
      </div>
    );
  }

  const depositAmount = Math.round(booking.totalAmount * 0.3 * 100) / 100;
  const balanceAmount = booking.totalAmount - depositAmount;
  const amountDueNow = payMode === "instant" ? booking.totalAmount : depositAmount;

  function handleResult(result: WebSdkResult) {
    if (result.result === "APPROVED") {
      setConfirming(true);
      if (payMode === "instant") {
        confirmFullPayment(bookingId, result);
      } else {
        payDeposit(bookingId, depositAmount, result);
      }
      router.push(`/booking/${bookingId}/confirmation`);
    } else if (result.result === "DECLINED" || result.result === "ERROR") {
      setResultMessage(result.errorDescription || "El pago no se ha podido completar. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">
            Resumen de la reserva
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-ink-900">{booking.listingTitle}</h2>
          <p className="mt-1 text-sm text-ink-700">
            {new Date(booking.checkIn).toLocaleDateString("es-ES")} →{" "}
            {new Date(booking.checkOut).toLocaleDateString("es-ES")} · {booking.nights} noches ·{" "}
            {booking.guests} huéspedes
          </p>

          <div className="mt-4 rounded-xl bg-sand-50 p-3 text-sm text-ink-700">
            <div className="flex justify-between">
              <span>Total de la estancia</span>
              <span className="font-semibold text-ink-900">
                {formatMoney(convertFromEur(booking.totalAmount, currency), currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-sand-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ink-900">¿Cómo quieres pagar?</p>
          <div className="space-y-2">
            <button
              onClick={() => setPayMode("instant")}
              className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                payMode === "instant" ? "border-coral-500 bg-coral-50" : "border-sand-200 hover:border-sand-300"
              }`}
            >
              <p className="font-semibold text-ink-900">Pagar el total ahora</p>
              <p className="text-xs text-ink-700">
                {formatMoney(convertFromEur(booking.totalAmount, currency), currency)} — reserva instantánea
              </p>
            </button>
            <button
              onClick={() => setPayMode("deposit")}
              className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                payMode === "deposit" ? "border-coral-500 bg-coral-50" : "border-sand-200 hover:border-sand-300"
              }`}
            >
              <p className="font-semibold text-ink-900">Pagar el 30% ahora, el resto más tarde</p>
              <p className="text-xs text-ink-700">
                Hoy: {formatMoney(convertFromEur(depositAmount, currency), currency)} · Resto (
                {formatMoney(convertFromEur(balanceAmount, currency), currency)}) se cobrará automáticamente a
                tu tarjeta guardada, sin volver a pedir los datos.
              </p>
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-700">
          Pago con tarjeta a través del Web SDK de Nuvei: campos propios con estilo Casitas y
          autenticación 3D Secure real, en vez de un widget alojado por Nuvei.
        </p>
      </div>

      <div>
        <div className="mb-3 rounded-xl bg-ink-900 px-4 py-2 text-center text-sm font-semibold text-white">
          A pagar ahora: {formatMoney(convertFromEur(amountDueNow, currency), currency)}
        </div>
        {confirming ? (
          <p className="p-6 text-center text-sm text-ink-700">Confirmando tu reserva…</p>
        ) : (
          <NuveiWebSdkCheckout
            key={payMode}
            amountEur={amountDueNow}
            currency={currency}
            transactionType="Sale"
            userTokenId={booking.id}
            guestName={booking.guestName}
            guestEmail={booking.guestEmail}
            onResult={handleResult}
          />
        )}
        {resultMessage && (
          <p className="mt-2 text-center text-xs font-medium text-coral-700">{resultMessage}</p>
        )}
      </div>
    </div>
  );
}
