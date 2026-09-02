"use client";

import Link from "next/link";
import { useCurrency } from "./CurrencyProvider";
import type { Currency } from "@/lib/types";

const CURRENCIES: Currency[] = ["EUR", "GBP", "USD"];

export default function Nav() {
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-2xl font-bold text-coral-600">
          casitas<span className="text-teal-600">.</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-700 sm:flex">
          <Link href="/search" className="hover:text-coral-600">
            Explorar
          </Link>
          <Link href="/admin" className="hover:text-coral-600">
            Casitas Payments (back office)
          </Link>
        </nav>

        <div className="flex items-center gap-1 rounded-full border border-sand-200 bg-white p-1 text-xs font-semibold">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-full px-2.5 py-1 transition ${
                currency === c ? "bg-teal-600 text-white" : "text-ink-700 hover:bg-sand-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
