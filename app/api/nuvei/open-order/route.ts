import { NextResponse } from "next/server";
import { openOrder, nuveiConfigured } from "@/lib/nuvei";
import type { Currency } from "@/lib/types";

// Stateless proxy: takes exactly what's needed to open a Nuvei order and returns Nuvei's
// response. No booking lookup, no store of any kind — the caller (BookingsProvider, client-
// side) already knows the amount/currency and updates its own state once the payment result
// comes back via the Simply Connect widget's onResult callback.
export async function POST(req: Request) {
  const { amount, currency, transactionType, userTokenId, country } = (await req.json()) as {
    amount: string;
    currency: Currency;
    transactionType?: "Sale" | "Auth";
    userTokenId?: string;
    country?: string;
  };

  if (!nuveiConfigured()) {
    return NextResponse.json(
      { error: "nuvei_not_configured", message: "Faltan las credenciales de Nuvei en el servidor." },
      { status: 503 }
    );
  }

  const result = await openOrder({
    amount,
    currency,
    userTokenId,
    transactionType: transactionType || "Sale",
  });

  if (result.status !== "SUCCESS" || !result.sessionToken) {
    return NextResponse.json({ error: "open_order_failed", detail: result }, { status: 502 });
  }

  return NextResponse.json({
    sessionToken: result.sessionToken,
    merchantId: process.env.NUVEI_MERCHANT_ID,
    merchantSiteId: process.env.NUVEI_MERCHANT_SITE_ID,
    env: process.env.NUVEI_ENV || "int",
    amount,
    currency,
    // Spain-first per the brief; the checkout() widget requires a country to initialize.
    country: country || "ES",
    transactionType: transactionType || "Sale",
  });
}
