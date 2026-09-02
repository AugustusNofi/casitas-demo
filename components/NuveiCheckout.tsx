"use client";

import { useEffect, useId, useState } from "react";
import Script from "next/script";
import type { OpenOrderMode } from "@/app/api/nuvei/open-order/route";
import type { Currency } from "@/lib/types";

interface NuveiResult {
  result?: "APPROVED" | "DECLINED" | "ERROR" | "PENDING" | string;
  errCode?: number;
  errorDescription?: string;
  transactionId?: string;
  userPaymentOptionId?: string;
  last4Digits?: string;
}

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
  onResult?: (result: NuveiResult) => void;
}

// Renders Nuvei's Simply Connect 1.0 embedded checkout UI (window.checkout(), confirmed
// against the real checkout.js bundle: it requires renderTo — a CSS selector matching
// exactly one element — plus sessionToken/merchantId/merchantSiteId/country/currency/amount,
// and takes an events.onResult callback). The flow is:
//   1. Ask our backend to /openOrder for this booking + mode → sessionToken + amount/currency.
//   2. Load Nuvei's checkout.js and call the global checkout() with that data.
//   3. Nuvei's own UI collects card / Bizum / PayPal / wallet details and runs 3DS2.
//   4. onResult gives fast client-side feedback, but the DMN webhook
//      (/api/webhooks/nuvei/dmn) is the authoritative source of truth for booking status —
//      the parent component polls booking status regardless of what onResult reports.
export default function NuveiCheckout({ bookingId, mode, currency, onOrderCreated, onResult }: NuveiCheckoutProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // useId() (not Math.random()) keeps this stable across server/client render to avoid a
  // hydration mismatch; colons are stripped since Nuvei's SDK uses this as a CSS selector
  // (document.querySelectorAll), where React's default useId() format isn't valid syntax.
  const rawId = useId();
  const containerId = `nuvei-checkout-${rawId.replace(/:/g, "")}`;

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
            amount: data.amount,
            currency: data.currency,
            country: data.country,
            renderTo: `#${containerId}`,
            events: {
              onResult: (result: NuveiResult) => {
                onResult?.(result);
              },
            },
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
      <Script src="https://cdn.safecharge.com/safecharge_resources/v1/checkout/checkout.js" strategy="afterInteractive" />
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
