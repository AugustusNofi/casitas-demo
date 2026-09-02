"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Currency } from "@/lib/types";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "EUR",
  setCurrency: () => {},
});

const STORAGE_KEY = "casitas-currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Currency | null;
      if (stored === "EUR" || stored === "GBP" || stored === "USD") {
        setCurrencyState(stored);
      }
    } catch {
      // localStorage unavailable — stay on EUR default
    }
  }, []);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
