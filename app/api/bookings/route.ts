import { NextResponse } from "next/server";
import { newId } from "@/lib/id";
import { getListing, saveBooking, appendTimelineEvent } from "@/lib/kv";
import type { Booking, Currency } from "@/lib/types";

function nightsBetween(checkIn: string, checkOut: string): number {
  const inD = new Date(checkIn);
  const outD = new Date(checkOut);
  const diff = Math.round((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { listingId, checkIn, checkOut, guests, guestName, guestEmail, currency } = body as {
    listingId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestName: string;
    guestEmail: string;
    currency: Currency;
  };

  const listing = await getListing(listingId);
  if (!listing) {
    return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
  }

  const nights = nightsBetween(checkIn, checkOut);
  const totalAmount = Math.round(nights * listing.pricePerNightEur * 100) / 100;

  const checkInDate = new Date(checkIn);
  const freeCancellationUntil = listing.freeCancellation
    ? new Date(checkInDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    : new Date().toISOString();

  const now = new Date().toISOString();
  const booking: Booking = {
    id: newId("bk"),
    listingId: listing.id,
    listingTitle: listing.title,
    guestName: guestName || "Huésped Casitas",
    guestEmail: guestEmail || "huesped@example.com",
    checkIn,
    checkOut,
    guests: guests || 2,
    nights,
    currency: currency || "EUR",
    totalAmount,
    status: "pending",
    flow: "instant",
    freeCancellationUntil,
    cancellationPolicyPct: 50,
    securityDepositAmount: 250,
    transactionIds: {},
    createdAt: now,
    updatedAt: now,
  };

  await saveBooking(booking);
  await appendTimelineEvent({
    id: newId("evt"),
    bookingId: booking.id,
    type: "booking_created",
    label: "Reserva creada, pendiente de pago",
    source: "guest",
    createdAt: now,
  });

  return NextResponse.json({ booking });
}
