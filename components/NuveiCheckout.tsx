"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { OpenOrderMode } from "@/app/api/nuvei/open-order/route";
import type { Currency } from "@/lib/types";

declare global {
  interface Window {
    checkout?: (config: Record<string, unknown>) => void;
  }
}

interface NuveiCheckoutProps {
  bookingId: string;
  mode: OpenOrderMode;
  currency: Currency;
  onOrderCreated?: (info: { amount: string; currency: string }) => void;
}

// Renders Nuvei's Simply Connect 1.0 embedded checkout UI. The flow is:
//   1. Ask our backend to /openOrder for this booking + mode → sessionToken.
//   2. Load Nuvei's checkout.js and call the global checkout() with that token.
//   3. Nuvei's own UI collects card / Bizum / PayPal / wallet details and runs 3DS2.
//   4. The authoritative result arrives server-side via DMN (see /api/webhooks/nuvei/dmn);
//      this component just re-fetches booking status once the widget reports completion.
export default function NuveiCheckout({ bookingId, mode, currency, onOrderCreated }: NuveiCheckoutProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scriptLoaded = useRef(false);
  const containerId = "nuvei-checkout-container";

  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const res = await fetch("/api/nuvei/open-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, mode, currency }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || "No se pudo iniciar el pago");
        }
        if (cancelled) return;

        onOrderCreated?.({ amount: data.amount, currency: data.currency });

        function render() {
          if (!window.checkout) return;
          window.checkout({
            sessionToken: data.sessionToken,
            merchantId: data.merchantId,
            merchantSiteId: data.merchantSiteId,
            env: data.env,
            containerId,
          });
          setStatus("ready");
        }

        if (window.checkout) {
          render();
        } else {
          const check = setInterval(() => {
            if (window.checkout) {
              clearInterval(check);
              render();
            }
          }, 200);
          setTimeout(() => clearInterval(check), 10000);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
        }
      }
    }

    start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, mode, currency]);

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <Script
        src="https://cdn.safecharge.com/safecharge_resources/v1/checkout/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          scriptLoaded.current = true;
        }}
      />
      {status === "loading" && (
        <p className="p-6 text-center text-sm text-ink-700">Preparando el pago seguro…</p>
      )}
      {status === "error" && (
        <div className="p-6 text-center text-sm text-coral-700">
          <p className="font-semibold">No se pudo iniciar el pago.</p>
          <p className="mt-1 text-xs">{errorMessage}</p>
          <p className="mt-2 text-xs text-ink-700">
            Comprueba que las credenciales de Nuvei estén configuradas en el servidor.
          </p>
        </div>
      )}
      <div id={containerId} className="min-h-[320px]" />
    </div>
  );
}
