import { NextResponse } from "next/server";
import { getBooking, saveBooking, appendTimelineEvent, logTransaction } from "@/lib/kv";
import { voidTransaction, nuveiConfigured } from "@/lib/nuvei";
import { newId } from "@/lib/id";

// Flow 3 — releases the security-deposit authorization (void), no funds ever captured.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (booking.status !== "hold_active" || !booking.holdTransactionId) {
    return NextResponse.json({ error: "invalid_state" }, { status: 400 });
  }
  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }

  const result = await voidTransaction({ relatedTransactionId: booking.holdTransactionId });
  await logTransaction(id, "release-hold", result);
  const now = new Date().toISOString();

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    booking.status = "hold_released";
    booking.updatedAt = now;
    await saveBooking(booking);

    await appendTimelineEvent({
      id: newId("evt"),
      bookingId: id,
      type: "hold_released",
      label: "Fianza liberada (void de la autorización)",
      transactionId: result.transactionId,
      source: "admin",
      createdAt: now,
    });

    return NextResponse.json({ ok: true, booking });
  }

  return NextResponse.json({ error: "void_failed", detail: result }, { status: 502 });
}
