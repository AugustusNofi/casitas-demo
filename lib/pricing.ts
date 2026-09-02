import type { Currency } from "./types";

// Static demo FX table (illustrative, not live rates). Prices are stored in EUR;
// this re-prices for display AND for the amount actually sent to Nuvei at checkout,
// demonstrating a buyer-facing display/charge currency distinct from the merchant's
// underlying settlement currency.
export const FX_RATES: Record<Currency, number> = {
  EUR: 1,
  GBP: 0.86,
  USD: 1.09,
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "€",
  GBP: "£",
  USD: "$",
};

export function convertFromEur(amountEur: number, currency: Currency): number {
  return amountEur * FX_RATES[currency];
}

export function formatMoney(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency];
  const rounded = Math.round(amount * 100) / 100;
  const formatted = rounded.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "EUR" ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export function amountForNuvei(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}
