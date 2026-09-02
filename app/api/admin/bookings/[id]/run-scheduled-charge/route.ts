import { NextResponse } from "next/server";
import { getBooking, saveBooking, appendTimelineEvent, logTransaction } from "@/lib/kv";
import { chargeStoredPaymentOption, nuveiConfigured } from "@/lib/nuvei";
import { amountForNuvei } from "@/lib/pricing";
import { newId } from "@/lib/id";

// Flow 2 — charges the remaining balance using the card tokenized during the deposit
// payment (userTokenId + userPaymentOptionId), with no card re-entry. In a real system
// this would run on a cron at balanceScheduledFor; here the back office triggers it
// on demand to simulate the scheduled date arriving.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (booking.status !== "deposit_paid") {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }
  if (!booking.userTokenId || !booking.userPaymentOptionId) {
    return NextResponse.json({ error: "no_stored_payment_option" }, { status: 400 });
  }
  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }

  const amountEur = booking.balanceAmount || booking.totalAmount - (booking.depositAmount || 0);
  const result = await chargeStoredPaymentOption({
    userTokenId: booking.userTokenId,
    userPaymentOptionId: booking.userPaymentOptionId,
    amount: amountForNuvei(amountEur),
    currency: booking.currency,
  });

  await logTransaction(id, "run-scheduled-charge", result);
  const now = new Date().toISOString();

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    booking.status = "paid_in_full";
    booking.balanceChargedAt = now;
    booking.transactionIds.balance = result.transactionId || booking.transactionIds.balance;
    booking.updatedAt = now;
    await saveBooking(booking);

    await appendTimelineEvent({
      id: newId("evt"),
      bookingId: id,
      type: "balance_charged",
      label: "Saldo restante cobrado automáticamente (tarjeta guardada, sin reintroducir datos)",
      amount: amountEur,
      currency: booking.currency,
      transactionId: result.transactionId,
      source: "admin",
      createdAt: now,
    });

    return NextResponse.json({ ok: true, booking });
  }

  return NextResponse.json({ error: "charge_failed", detail: result }, { status: 502 });
}
