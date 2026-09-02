import { NextResponse } from "next/server";
import { getBooking, saveBooking, appendTimelineEvent, logTransaction } from "@/lib/kv";
import { settleTransaction, nuveiConfigured } from "@/lib/nuvei";
import { amountForNuvei } from "@/lib/pricing";
import { newId } from "@/lib/id";

// Flow 3 — captures part (or all) of the held security-deposit authorization to cover
// reported damages. Demonstrates auth vs. capture separation: only the claimed amount
// is ever actually charged.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { amount } = (await req.json()) as { amount: number };

  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (booking.status !== "hold_active" || !booking.holdTransactionId) {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }
  const maxAmount = booking.securityDepositAmount || 250;
  if (!amount || amount <= 0 || amount > maxAmount) {
    return NextResponse.json({ error: "invalid_amount", maxAmount }, { status: 400 });
  }
  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }

  const result = await settleTransaction({
    relatedTransactionId: booking.holdTransactionId,
    amount: amountForNuvei(amount),
    currency: booking.currency,
  });

  await logTransaction(id, "claim-damages", result);
  const now = new Date().toISOString();

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    booking.status = "hold_claimed";
    booking.updatedAt = now;
    await saveBooking(booking);

    await appendTimelineEvent({
      id: newId("evt"),
      bookingId: id,
      type: "hold_claimed",
      label: `Daños reclamados: captura parcial de la fianza (${amount} de ${maxAmount})`,
      amount,
      currency: booking.currency,
      transactionId: result.transactionId,
      source: "admin",
      createdAt: now,
    });

    return NextResponse.json({ ok: true, booking });
  }

  return NextResponse.json({ error: "capture_failed", detail: result }, { status: 502 });
}
