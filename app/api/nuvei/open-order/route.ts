import { NextResponse } from "next/server";
import { getBooking, saveBooking, logTransaction } from "@/lib/kv";
import { openOrder, getDmnNotificationUrl, nuveiConfigured } from "@/lib/nuvei";
import { amountForNuvei, convertFromEur } from "@/lib/pricing";
import type { Currency } from "@/lib/types";

export type OpenOrderMode = "instant" | "deposit" | "security_deposit";

export async function POST(req: Request) {
  const { bookingId, mode, currency } = (await req.json()) as {
    bookingId: string;
    mode: OpenOrderMode;
    currency: Currency;
  };

  const booking = await getBooking(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
  }

  if (!nuveiConfigured()) {
    return NextResponse.json(
      { error: "nuvei_not_configured", message: "Faltan las credenciales de Nuvei en el servidor." },
      { status: 503 }
    );
  }

  let amountEur: number;
  let transactionType: "Sale" | "Auth" = "Sale";

  if (mode === "instant") {
    amountEur = booking.totalAmount;
  } else if (mode === "deposit") {
    amountEur = Math.round(booking.totalAmount * 0.3 * 100) / 100;
  } else {
    amountEur = booking.securityDepositAmount || 250;
    transactionType = "Auth";
  }

  const amount = amountForNuvei(convertFromEur(amountEur, currency));
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const returnUrl = `${base}/checkout/${booking.id}/return`;
  // Nuvei rejects non-HTTPS redirect/notification URLs, so during local dev (http://localhost)
  // we skip urlDetails entirely — DMN and redirects can't reach localhost anyway; completion
  // is only observable via the deployed HTTPS URL. The embedded widget itself still renders.
  const isHttps = base.startsWith("https://");

  const result = await openOrder({
    amount,
    currency,
    userTokenId: booking.id,
    transactionType,
    ...(isHttps
      ? {
          notificationUrl: getDmnNotificationUrl(),
          successUrl: returnUrl,
          failureUrl: returnUrl,
          pendingUrl: returnUrl,
        }
      : {}),
  });

  await logTransaction(booking.id, `open-order:${mode}`, result);

  if (result.status !== "SUCCESS" || !result.sessionToken) {
    return NextResponse.json({ error: "open_order_failed", detail: result }, { status: 502 });
  }

  booking.currency = currency;
  booking.pendingIntent = mode;
  booking.updatedAt = new Date().toISOString();
  await saveBooking(booking);

  return NextResponse.json({
    sessionToken: result.sessionToken,
    merchantId: process.env.NUVEI_MERCHANT_ID,
    merchantSiteId: process.env.NUVEI_MERCHANT_SITE_ID,
    env: process.env.NUVEI_ENV || "int",
    amount,
    currency,
    transactionType,
    userTokenId: booking.id,
  });
}
