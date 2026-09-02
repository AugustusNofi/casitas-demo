import { NextResponse } from "next/server";
import { getBooking, saveBooking, appendTimelineEvent, logTransaction } from "@/lib/kv";
import { refundTransaction, nuveiConfigured } from "@/lib/nuvei";
import { amountForNuvei } from "@/lib/pricing";
import { newId } from "@/lib/id";

// Manual refund override for the back office (flow 4, admin-triggered path).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { amount } = (await req.json()) as { amount: number };

  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const paidTxnId = booking.transactionIds.sale || booking.transactionIds.deposit;
  const paidAmount = booking.transactionIds.sale ? booking.totalAmount : booking.depositAmount;
  if (!paidTxnId || !paidAmount) {
    return NextResponse.json({ error: "nothing_to_refund" }, { status: 400 });
  }
  const refundAmount = amount && amount > 0 && amount <= paidAmount ? amount : paidAmount;
  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }

  const result = await refundTransaction({
    relatedTransactionId: paidTxnId,
    amount: amountForNuvei(refundAmount),
    currency: booking.currency,
  });

  await logTransaction(id, "admin-refund", result);
  const now = new Date().toISOString();

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    booking.status = refundAmount >= paidAmount ? "refunded" : "partially_refunded";
    booking.refundedAmount = refundAmount;
    booking.transactionIds.refund = result.transactionId || booking.transactionIds.refund;
    booking.updatedAt = now;
    await saveBooking(booking);

    await appendTimelineEvent({
      id: newId("evt"),
      bookingId: id,
      type: "refunded",
      label: "Reembolso manual procesado desde el back office",
      amount: refundAmount,
      currency: booking.currency,
      transactionId: result.transactionId,
      source: "admin",
      createdAt: now,
    });

    return NextResponse.json({ ok: true, booking });
  }

  return NextResponse.json({ error: "refund_failed", detail: result }, { status: 502 });
}
