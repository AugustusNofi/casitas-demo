"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NuveiCheckout from "./NuveiCheckout";
import { useCurrency } from "./CurrencyProvider";
import { convertFromEur, formatMoney } from "@/lib/pricing";
import type { Booking } from "@/lib/types";
import type { OpenOrderMode } from "@/app/api/nuvei/open-order/route";

export default function CheckoutFlow({ booking }: { booking: Booking }) {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [payMode, setPayMode] = useState<"instant" | "deposit">("instant");
  const [polling, setPolling] = useState(false);

  // Checkout uses the currency the booking was created with, so the price shown here
  // matches what's actually sent to Nuvei — switching the nav currency mid-checkout
  // would desync the two, so we pin it once on mount.
  useEffect(() => {
    if (currency !== booking.currency) setCurrency(booking.currency);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/bookings/${booking.id}`);
      const data = await res.json();
      if (data.booking && data.booking.status !== "pending") {
        clearInterval(interval);
        router.push(`/booking/${booking.id}/confirmation`);
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [polling, booking.id, router]);

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
  const mode: OpenOrderMode = payMode;

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
          Métodos disponibles: tarjeta con 3DS2, Bizum, PayPal, Apple Pay y Google Pay (según
          compatibilidad de tu dispositivo/navegador y configuración del comercio en Nuvei).
        </p>
      </div>

      <div>
        <div className="mb-3 rounded-xl bg-ink-900 px-4 py-2 text-center text-sm font-semibold text-white">
          A pagar ahora: {formatMoney(convertFromEur(amountDueNow, currency), currency)}
        </div>
        <NuveiCheckout
          key={mode}
          bookingId={booking.id}
          mode={mode}
          currency={currency}
          onOrderCreated={() => setPolling(true)}
        />
        {polling && (
          <p className="mt-2 text-center text-xs text-ink-700">
            Esperando confirmación de Nuvei… esto se actualiza automáticamente.
          </p>
        )}
      </div>
    </div>
  );
}
