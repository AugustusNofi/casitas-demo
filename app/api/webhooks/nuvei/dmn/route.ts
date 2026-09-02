import { NextResponse } from "next/server";
import { getBooking, saveBooking, appendTimelineEvent, logTransaction } from "@/lib/kv";
import { newId } from "@/lib/id";
import type { Booking } from "@/lib/types";

// Nuvei Direct Merchant Notification (DMN) — the authoritative server-to-server signal for
// transaction status. We correlate a DMN back to a booking via `userTokenId`, which every
// /openOrder call in this app sets to the booking id. Accepts GET or POST per Nuvei's docs
// (some merchant configs send DMNs as GET query strings, others as POST bodies).
async function handleDmn(params: Record<string, string>) {
  const bookingId = params.userTokenId;
  const status = params.Status || params.status;
  const pppStatus = params.ppp_status;
  const transactionId = params.TransactionId || params.transactionId;
  const amount = params.totalAmount || params.amount;
  const currency = params.currency;

  if (!bookingId) {
    return { ok: false, reason: "missing_userTokenId" };
  }

  const booking = await getBooking(bookingId);
  if (!booking) {
    return { ok: false, reason: "booking_not_found" };
  }

  await logTransaction(bookingId, "dmn", params);

  const approved = status === "APPROVED" || pppStatus === "OK";
  const now = new Date().toISOString();

  if (!approved) {
    await appendTimelineEvent({
      id: newId("evt"),
      bookingId,
      type: "dmn_received",
      label: `Notificación de Nuvei: pago no aprobado (${status || pppStatus || "desconocido"})`,
      source: "nuvei_dmn",
      createdAt: now,
    });
    return { ok: true, handled: "not_approved" };
  }

  const intent = booking.pendingIntent || "instant";

  if (intent === "instant") {
    booking.status = "paid_in_full";
    booking.transactionIds.sale = transactionId || booking.transactionIds.sale;
    await appendTimelineEvent({
      id: newId("evt"),
      bookingId,
      type: "settled",
      label: "Pago completo liquidado",
      amount: amount ? Number(amount) : undefined,
      currency: currency as Booking["currency"],
      transactionId,
      source: "nuvei_dmn",
      createdAt: now,
    });
  } else if (intent === "deposit") {
    booking.status = "deposit_paid";
    booking.depositAmount = amount ? Number(amount) : booking.depositAmount;
    booking.balanceAmount = booking.totalAmount - (booking.depositAmount || 0);
    booking.balanceScheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    booking.userTokenId = bookingId;
    booking.userPaymentOptionId = params.userPaymentOptionId || booking.userPaymentOptionId;
    booking.cardLast4 = params.last4Digits || (params.ccCardNumber || "").slice(-4) || booking.cardLast4;
    booking.cardBrand = params.cardBrand || booking.cardBrand;
    booking.transactionIds.deposit = transactionId || booking.transactionIds.deposit;
    await appendTimelineEvent({
      id: newId("evt"),
      bookingId,
      type: "deposit_charged",
      label: "Depósito del 30% cobrado",
      amount: amount ? Number(amount) : undefined,
      currency: currency as Booking["currency"],
      transactionId,
      source: "nuvei_dmn",
      createdAt: now,
    });
    await appendTimelineEvent({
      id: newId("evt"),
      bookingId,
      type: "balance_scheduled",
      label: "Cobro del saldo restante programado",
      detail: "Se ejecutará automáticamente con la tarjeta guardada (tokenizada), sin pedirla de nuevo.",
      source: "system",
      createdAt: now,
    });
  } else if (intent === "security_deposit") {
    booking.status = "hold_active";
    booking.holdTransactionId = transactionId;
    booking.transactionIds.hold = transactionId || booking.transactionIds.hold;
    await appendTimelineEvent({
      id: newId("evt"),
      bookingId,
      type: "hold_placed",
      label: "Retención de fianza autorizada (auth-only, sin captura)",
      amount: amount ? Number(amount) : undefined,
      currency: currency as Booking["currency"],
      transactionId,
      source: "nuvei_dmn",
      createdAt: now,
    });
  }

  booking.pendingIntent = undefined;
  booking.updatedAt = now;
  await saveBooking(booking);

  return { ok: true, handled: intent };
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  let params: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    params = await req.json();
  } else {
    const text = await req.text();
    params = Object.fromEntries(new URLSearchParams(text));
  }

  const result = await handleDmn(params);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const result = await handleDmn(params);
  return NextResponse.json(result);
}
