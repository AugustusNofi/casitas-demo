"use client";

import { useState } from "react";

interface TestCard {
  label: string;
  brand: string;
  number: string;
  exp: string;
  cvv: string;
}

// Known Nuvei sandbox test cards — both numbers below are taken verbatim from Nuvei's own
// published documentation examples (PCI/tokenization, zero-authorization, unreferenced refund
// guides), not guessed. For scenario-specific cards (guaranteed 3DS2 challenge vs. frictionless,
// or a guaranteed decline), pull the current numbers from the Testing Cards page in your Nuvei
// account — those can change and weren't verified here.
const TEST_CARDS: TestCard[] = [
  { label: "Visa · aprobada", brand: "VISA", number: "4000027891380961", exp: "12 / 30", cvv: "217" },
  { label: "Mastercard · aprobada", brand: "MASTERCARD", number: "5101081046006034", exp: "12 / 26", cvv: "123" },
];

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore, value is still visible/selectable
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copiar ${label.toLowerCase()}`}
      className="group flex items-center gap-1.5 rounded-lg border border-sand-200 bg-sand-50 px-2 py-1 font-mono text-xs text-ink-900 transition hover:border-teal-500 hover:bg-teal-50"
    >
      {value}
      <span className="text-[10px] text-ink-700 group-hover:text-teal-700">
        {copied ? "✓" : "⧉"}
      </span>
    </button>
  );
}

export default function TestCardsPanel() {
  return (
    <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        🧪 Tarjetas de sandbox de Nuvei
      </p>
      <p className="mt-1 text-[11px] text-ink-700">
        Usa cualquiera de estas para probar los flujos de pago. Haz clic en un campo para
        copiarlo.
      </p>
      <div className="mt-3 space-y-2">
        {TEST_CARDS.map((card) => (
          <div key={card.number} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 shrink-0 text-[11px] font-medium text-ink-700">{card.label}</span>
            <CopyField label="Número de tarjeta" value={card.number} />
            <CopyField label="Caducidad" value={card.exp} />
            <CopyField label="CVV" value={card.cvv} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ink-700">
        Para escenarios concretos de 3DS2 (reto garantizado, denegación, etc.), usa la página
        Testing Cards de tu cuenta Nuvei.
      </p>
    </div>
  );
}
