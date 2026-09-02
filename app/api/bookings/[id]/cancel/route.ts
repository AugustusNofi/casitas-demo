import { NextResponse } from "next/server";
import { getBooking, saveBooking, appendTimelineEvent, logTransaction } from "@/lib/kv";
import { refundTransaction, nuveiConfigured } from "@/lib/nuvei";
import { amountForNuvei } from "@/lib/pricing";
import { newId } from "@/lib/id";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const paidTxnId = booking.transactionIds.sale || booking.transactionIds.deposit;
  const paidAmount = booking.transactionIds.sale ? booking.totalAmount : booking.depositAmount;

  if (!paidTxnId || !paidAmount) {
    return NextResponse.json({ error: "nothing_to_refund" }, { status: 400 });
  }

  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }

  const now = new Date();
  const withinFreeWindow = now <= new Date(booking.freeCancellationUntil);
  const refundAmount = withinFreeWindow
    ? paidAmount
    : Math.round((paidAmount * booking.cancellationPolicyPct) / 100 * 100) / 100;

  const result = await refundTransaction({
    relatedTransactionId: paidTxnId,
    amount: amountForNuvei(refundAmount),
    currency: booking.currency,
  });

  await logTransaction(id, "cancel-refund", result);

  const nowIso = now.toISOString();
  await appendTimelineEvent({
    id: newId("evt"),
    bookingId: id,
    type: "cancelled",
    label: withinFreeWindow
      ? "Cancelada dentro del plazo de cancelación gratuita"
      : "Cancelada fuera del plazo de cancelación gratuita",
    source: "guest",
    createdAt: nowIso,
  });

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    booking.status = withinFreeWindow ? "refunded" : "partially_refunded";
    booking.refundedAmount = refundAmount;
    booking.transactionIds.refund = result.transactionId || booking.transactionIds.refund;
    booking.updatedAt = nowIso;
    await saveBooking(booking);

    await appendTimelineEvent({
      id: newId("evt"),
      bookingId: id,
      type: "refunded",
      label: withinFreeWindow ? "Reembolso completo procesado" : `Reembolso parcial procesado (${booking.cancellationPolicyPct}%)`,
      amount: refundAmount,
      currency: booking.currency,
      transactionId: result.transactionId,
      source: "system",
      createdAt: nowIso,
    });

    return NextResponse.json({ ok: true, refundAmount, withinFreeWindow, booking });
  }

  return NextResponse.json({ error: "refund_failed", detail: result }, { status: 502 });
}
