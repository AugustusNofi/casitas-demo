"use client";

import { useEffect, useId, useRef, useState } from "react";
import Script from "next/script";
import { amountForNuvei, convertFromEur } from "@/lib/pricing";
import type { Currency } from "@/lib/types";

export interface WebSdkResult {
  result?: "APPROVED" | "DECLINED" | "ERROR" | "PENDING" | string;
  errCode?: number | string;
  errorDescription?: string;
  transactionId?: string;
  userPaymentOptionId?: string;
  last4Digits?: string;
  cancelled?: boolean;
}

interface SdkField {
  attach: (container: HTMLElement) => void;
  on: (event: string, cb: (e: unknown) => void) => void;
  setValue: (value: string) => void;
}
interface SdkFields {
  create: (type: "ccNumber" | "ccExpiration" | "ccCvc", options: Record<string, unknown>) => SdkField;
}
interface SdkInstance {
  fields: (config: Record<string, unknown>) => SdkFields;
  createPayment: (options: Record<string, unknown>, callback: (result: WebSdkResult) => void) => void;
}

declare global {
  interface Window {
    SafeCharge?: (config: Record<string, unknown>) => SdkInstance;
  }
}

interface Props {
  amountEur: number;
  currency: Currency;
  transactionType?: "Sale" | "Auth";
  userTokenId: string;
  guestName?: string;
  guestEmail?: string;
  onResult?: (result: WebSdkResult) => void;
}

const FIELD_STYLE = {
  style: {
    base: { fontSize: "15px", color: "#2a2420", fontFamily: "inherit", lineHeight: "24px" },
    focus: { color: "#0f8b8d" },
    invalid: { color: "#cf3f20" },
  },
};

// Nuvei's documented sandbox 3DS2 test scenarios (docs.nuvei.com/documentation/integration/
// testing/testing-cards/) — the cardholder name is not arbitrary here: Nuvei's test environment
// reads specific cardHolderName codes (paired with a specific card number) to decide which 3DS
// flow to simulate. Values taken verbatim from that page, not guessed.
const TEST_SCENARIOS = [
  {
    key: "normal",
    label: "Normal (sin 3DS)",
    brand: "Visa",
    number: "4000027891380961",
    name: "Jane Smith",
    exp: "12/30",
    expValue: "1230",
    cvv: "217",
  },
  {
    key: "frictionless",
    label: "3DS2 — Frictionless",
    brand: "Visa",
    number: "4000020951595032",
    name: "FL-BRW1",
    exp: "12/30",
    expValue: "1230",
    cvv: "217",
  },
  {
    key: "challenge",
    label: "3DS2 — Challenge",
    brand: "Mastercard",
    number: "2221008123677736",
    name: "CL-BRW2",
    exp: "12/26",
    expValue: "1226",
    cvv: "123",
  },
] as const;

function formatCardNumber(n: string) {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

// Nuvei's Web SDK — full custom PCI-compliant card fields (card number / expiration / CVV each
// render as an individually mounted, hosted iframe via fields().create().attach()), instead of
// Simply Connect's single embedded widget. Real 3DS2 runs automatically inside createPayment().
// Confirmed against the actual safecharge.js bundle (docs.nuvei.com's search tool was down):
// SafeCharge({env, merchantId, merchantSiteId, sessionToken}).fields().create(type, opts) where
// type is exactly "ccNumber" | "ccExpiration" | "ccCvc"; each field instance's .attach(el) mounts
// it, .setValue(v) programmatically fills it (used by the test-scenario picker below); createPayment
// ({paymentOption: {card: {cardNumber: <ccNumber field instance>, cardHolderName}}}) posts
// directly to Nuvei (clientPayment.do) and manages the 3DS challenge itself.
export default function NuveiWebSdkCheckout({
  amountEur,
  currency,
  transactionType = "Sale",
  userTokenId,
  guestName,
  guestEmail,
  onResult,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState(guestName || "");
  const [appliedScenario, setAppliedScenario] = useState<(typeof TEST_SCENARIOS)[number] | null>(null);

  const numberElRef = useRef<HTMLDivElement>(null);
  const expElRef = useRef<HTMLDivElement>(null);
  const cvcElRef = useRef<HTMLDivElement>(null);
  const scRef = useRef<SdkInstance | null>(null);
  const numberFieldRef = useRef<SdkField | null>(null);
  const expFieldRef = useRef<SdkField | null>(null);
  const cvcFieldRef = useRef<SdkField | null>(null);
  const orderRef = useRef<{
    sessionToken: string;
    merchantId: string;
    merchantSiteId: string;
    amount: string;
    currency: string;
    country: string;
  } | null>(null);

  const uid = useId().replace(/:/g, "");
  const numberId = `sfc-number-${uid}`;
  const expId = `sfc-exp-${uid}`;
  const cvcId = `sfc-cvc-${uid}`;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const res = await fetch("/api/nuvei/open-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountForNuvei(convertFromEur(amountEur, currency)),
            currency,
            transactionType,
            userTokenId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || "No se pudo iniciar el pago");
        }
        if (cancelled) return;

        orderRef.current = {
          sessionToken: data.sessionToken,
          merchantId: data.merchantId,
          merchantSiteId: data.merchantSiteId,
          amount: data.amount,
          currency: data.currency,
          country: data.country,
        };

        function mount() {
          if (!window.SafeCharge || cancelled) return;
          const sc = window.SafeCharge({
            env: data.env,
            merchantId: data.merchantId,
            merchantSiteId: data.merchantSiteId,
            sessionToken: data.sessionToken,
          });
          scRef.current = sc;
          const fields = sc.fields({ locale: "es" });

          const numberField = fields.create("ccNumber", { ...FIELD_STYLE, placeholder: "Número de tarjeta" });
          const expField = fields.create("ccExpiration", { ...FIELD_STYLE, placeholder: "MM/AA" });
          const cvcField = fields.create("ccCvc", { ...FIELD_STYLE, placeholder: "CVV" });

          if (numberElRef.current) numberField.attach(numberElRef.current);
          if (expElRef.current) expField.attach(expElRef.current);
          if (cvcElRef.current) cvcField.attach(cvcElRef.current);

          numberFieldRef.current = numberField;
          expFieldRef.current = expField;
          cvcFieldRef.current = cvcField;
          setStatus("ready");
        }

        if (window.SafeCharge) {
          mount();
        } else {
          const check = setInterval(() => {
            if (window.SafeCharge) {
              clearInterval(check);
              mount();
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

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountEur, currency, transactionType, userTokenId]);

  function applyScenario(scenario: (typeof TEST_SCENARIOS)[number]) {
    setCardholderName(scenario.name);
    numberFieldRef.current?.setValue(scenario.number);
    expFieldRef.current?.setValue(scenario.expValue);
    cvcFieldRef.current?.setValue(scenario.cvv);
    setAppliedScenario(scenario);
    navigator.clipboard?.writeText(scenario.number).catch(() => {});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sc = scRef.current;
    const order = orderRef.current;
    const numberField = numberFieldRef.current;
    if (!sc || !order || !numberField || !cardholderName.trim()) return;

    setStatus("submitting");
    setErrorMessage(null);

    const [firstName, ...rest] = cardholderName.trim().split(" ");

    sc.createPayment(
      {
        sessionToken: order.sessionToken,
        merchantId: order.merchantId,
        merchantSiteId: order.merchantSiteId,
        currency: order.currency,
        amount: order.amount,
        userTokenId,
        paymentOption: {
          card: {
            cardNumber: numberField,
            cardHolderName: cardholderName.trim(),
          },
        },
        billingAddress: {
          email: guestEmail || "huesped@example.com",
          country: order.country,
          firstName: firstName || "Huésped",
          lastName: rest.join(" ") || "Casitas",
        },
      },
      (result: WebSdkResult) => {
        if (result.result === "APPROVED") {
          setStatus("ready");
        } else {
          setStatus("error");
          setErrorMessage(result.errorDescription || "El pago no se ha podido completar. Inténtalo de nuevo.");
        }
        onResult?.(result);
      }
    );
  }

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <Script src="https://cdn.safecharge.com/safecharge_resources/v1/websdk/safecharge.js" strategy="afterInteractive" />

      {status === "loading" && (
        <p className="p-6 text-center text-sm text-ink-700">Preparando el pago seguro…</p>
      )}

      <div className={status === "loading" ? "hidden" : "space-y-3"}>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-teal-700">
            🧪 Escenarios de prueba 3DS2 (sandbox Nuvei)
          </p>
          <div className="space-y-1.5">
            {TEST_SCENARIOS.map((scenario) => (
              <button
                key={scenario.key}
                type="button"
                onClick={() => applyScenario(scenario)}
                disabled={status !== "ready" && status !== "error"}
                className={`w-full rounded-xl border p-2.5 text-left text-sm transition disabled:opacity-50 ${
                  appliedScenario?.key === scenario.key
                    ? "border-teal-500 bg-teal-50"
                    : "border-sand-200 hover:border-sand-300"
                }`}
              >
                <span className="font-medium text-ink-900">{scenario.label}</span>
              </button>
            ))}
          </div>
          {appliedScenario && (
            <div className="mt-2 rounded-xl border border-dashed border-teal-300 bg-teal-50 p-2.5 text-xs text-teal-800">
              <span className="font-semibold">Tarjeta copiada:</span>{" "}
              <span className="font-mono">{formatCardNumber(appliedScenario.number)}</span> · {appliedScenario.exp}{" "}
              · CVV {appliedScenario.cvv}
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(appliedScenario.number).catch(() => {})}
                className="ml-2 rounded-full border border-teal-500 bg-white px-2 py-0.5 text-[11px] font-semibold text-teal-700"
              >
                Copiar
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase text-ink-700">
              Nombre en la tarjeta
            </span>
            <input
              type="text"
              placeholder="Nombre en la tarjeta"
              value={cardholderName}
              onChange={(e) => {
                setCardholderName(e.target.value);
                setAppliedScenario(null);
              }}
              required
              className="w-full rounded-xl border border-sand-200 px-3 py-2.5 text-sm outline-none focus:border-teal-500"
            />
          </label>
          <label htmlFor={numberId} className="block rounded-xl border border-sand-200 px-3 py-2.5">
            <span className="mb-0.5 block text-[10px] font-semibold uppercase text-ink-700">Número de tarjeta</span>
            <div id={numberId} ref={numberElRef} className="min-h-[24px]" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label htmlFor={expId} className="block rounded-xl border border-sand-200 px-3 py-2.5">
              <span className="mb-0.5 block text-[10px] font-semibold uppercase text-ink-700">Caducidad</span>
              <div id={expId} ref={expElRef} className="min-h-[24px]" />
            </label>
            <label htmlFor={cvcId} className="block rounded-xl border border-sand-200 px-3 py-2.5">
              <span className="mb-0.5 block text-[10px] font-semibold uppercase text-ink-700">CVV</span>
              <div id={cvcId} ref={cvcElRef} className="min-h-[24px]" />
            </label>
          </div>
          <button
            type="submit"
            disabled={status === "submitting" || (status !== "ready" && status !== "error")}
            className="w-full rounded-full bg-coral-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-coral-600 disabled:opacity-60"
          >
            {status === "submitting" ? "Procesando pago…" : "Pagar de forma segura"}
          </button>
          <p className="text-center text-[11px] text-ink-700">
            Pago protegido con 3D Secure — powered by Nuvei Web SDK
          </p>
        </form>
      </div>

      {errorMessage && <p className="mt-2 text-center text-xs font-medium text-coral-700">{errorMessage}</p>}
    </div>
  );
}
