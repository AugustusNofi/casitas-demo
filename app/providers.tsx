"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { newId } from "@/lib/id";
import { amountForNuvei } from "@/lib/pricing";
import seedBookings from "@/data/seed-bookings.json";
import type { Booking, Currency, TimelineEvent } from "@/lib/types";

const STORAGE_KEY = "casitas_bookings_v1";

interface BookingsState {
  bookings: Record<string, Booking>;
  timelines: Record<string, TimelineEvent[]>;
}

function seedState(): BookingsState {
  const bookings: Record<string, Booking> = {};
  const timelines: Record<string, TimelineEvent[]> = {};
  for (const entry of seedBookings as Array<{ booking: Booking; events: TimelineEvent[] }>) {
    bookings[entry.booking.id] = entry.booking;
    timelines[entry.booking.id] = entry.events;
  }
  return { bookings, timelines };
}

interface CreateBookingInput {
  listingId: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  currency: Currency;
  totalAmount: number;
  freeCancellationUntil: string;
  securityDepositAmount?: number;
}

interface NuveiResultLike {
  transactionId?: string;
  userPaymentOptionId?: string;
  last4Digits?: string;
}

interface BookingsContextValue {
  bookings: Booking[];
  getBooking: (id: string) => Booking | undefined;
  getTimeline: (id: string) => TimelineEvent[];
  createBooking: (input: CreateBookingInput) => Booking;
  confirmFullPayment: (bookingId: string, result: NuveiResultLike) => void;
  payDeposit: (bookingId: string, depositAmount: number, result: NuveiResultLike) => void;
  runScheduledBalanceCharge: (bookingId: string) => Promise<{ ok: boolean; error?: string }>;
  placeHold: (bookingId: string, result: NuveiResultLike) => void;
  releaseHold: (bookingId: string) => Promise<{ ok: boolean; error?: string }>;
  captureHold: (bookingId: string, amount: number) => Promise<{ ok: boolean; error?: string }>;
  refundBooking: (bookingId: string, amount?: number) => Promise<{ ok: boolean; error?: string; refundAmount?: number }>;
  cancelBooking: (bookingId: string) => Promise<{ ok: boolean; error?: string; refundAmount?: number; withinFreeWindow?: boolean }>;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

async function postJson<T = unknown>(url: string, body: unknown): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export function BookingsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingsState>(seedState);
  const hydrated = useRef(false);

  // Load from sessionStorage on mount (a fresh tab starts clean from the seed data; a
  // refresh mid-demo keeps whatever's there).
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // corrupt/unavailable storage — stay on seed data
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — state just won't survive a refresh
    }
  }, [state]);

  function updateBooking(id: string, patch: Partial<Booking>) {
    setState((s) => {
      const existing = s.bookings[id];
      if (!existing) return s;
      return {
        ...s,
        bookings: { ...s.bookings, [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() } },
      };
    });
  }

  function addEvent(bookingId: string, event: Omit<TimelineEvent, "id" | "bookingId" | "createdAt">) {
    const full: TimelineEvent = {
      ...event,
      id: newId("evt"),
      bookingId,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      timelines: { ...s.timelines, [bookingId]: [...(s.timelines[bookingId] || []), full] },
    }));
  }

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings: Object.values(state.bookings).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      getBooking: (id) => state.bookings[id],
      getTimeline: (id) => state.timelines[id] || [],

      createBooking: (input) => {
        const now = new Date().toISOString();
        const booking: Booking = {
          id: newId("bk"),
          listingId: input.listingId,
          listingTitle: input.listingTitle,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guests: input.guests,
          nights: Math.max(
            1,
            Math.round((new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 86400000)
          ),
          currency: input.currency,
          totalAmount: input.totalAmount,
          status: "pending",
          flow: "instant",
          freeCancellationUntil: input.freeCancellationUntil,
          cancellationPolicyPct: 50,
          securityDepositAmount: input.securityDepositAmount || 250,
          transactionIds: {},
          createdAt: now,
          updatedAt: now,
        };
        setState((s) => ({
          bookings: { ...s.bookings, [booking.id]: booking },
          timelines: { ...s.timelines, [booking.id]: [] },
        }));
        addEvent(booking.id, {
          type: "booking_created",
          label: "Reserva creada, pendiente de pago",
          source: "guest",
        });
        return booking;
      },

      confirmFullPayment: (bookingId, result) => {
        updateBooking(bookingId, {
          status: "paid_in_full",
          flow: "instant",
          transactionIds: { sale: result.transactionId || "" },
        });
        addEvent(bookingId, {
          type: "settled",
          label: "Pago completo liquidado",
          transactionId: result.transactionId,
          source: "system",
        });
      },

      payDeposit: (bookingId, depositAmount, result) => {
        const booking = state.bookings[bookingId];
        const balanceAmount = booking ? booking.totalAmount - depositAmount : undefined;
        updateBooking(bookingId, {
          status: "deposit_paid",
          flow: "deposit",
          depositAmount,
          balanceAmount,
          balanceScheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          userTokenId: bookingId,
          userPaymentOptionId: result.userPaymentOptionId,
          cardLast4: result.last4Digits,
          transactionIds: { deposit: result.transactionId || "" },
        });
        addEvent(bookingId, {
          type: "deposit_charged",
          label: "Depósito del 30% cobrado",
          amount: depositAmount,
          currency: booking?.currency,
          transactionId: result.transactionId,
          source: "system",
        });
        addEvent(bookingId, {
          type: "balance_scheduled",
          label: "Cobro del saldo restante programado",
          detail: "Se ejecutará automáticamente con la tarjeta guardada (tokenizada), sin pedirla de nuevo.",
          source: "system",
        });
      },

      runScheduledBalanceCharge: async (bookingId) => {
        const booking = state.bookings[bookingId];
        if (!booking || !booking.userTokenId || !booking.userPaymentOptionId) {
          return { ok: false, error: "no_stored_payment_option" };
        }
        const amountEur = booking.balanceAmount ?? booking.totalAmount - (booking.depositAmount || 0);
        const { ok, data } = await postJson<{ result?: { transactionId?: string; transactionStatus?: string }; error?: string }>(
          "/api/nuvei/rebill",
          {
            userTokenId: booking.userTokenId,
            userPaymentOptionId: booking.userPaymentOptionId,
            amount: amountForNuvei(amountEur),
            currency: booking.currency,
          }
        );
        if (!ok) return { ok: false, error: data.error };

        updateBooking(bookingId, {
          status: "paid_in_full",
          balanceChargedAt: new Date().toISOString(),
          transactionIds: { ...booking.transactionIds, balance: data.result?.transactionId || "" },
        });
        addEvent(bookingId, {
          type: "balance_charged",
          label: "Saldo restante cobrado automáticamente (tarjeta guardada, sin reintroducir datos)",
          amount: amountEur,
          currency: booking.currency,
          transactionId: data.result?.transactionId,
          source: "admin",
        });
        return { ok: true };
      },

      placeHold: (bookingId, result) => {
        updateBooking(bookingId, {
          status: "hold_active",
          holdTransactionId: result.transactionId,
          transactionIds: { hold: result.transactionId || "" },
        });
        const booking = state.bookings[bookingId];
        addEvent(bookingId, {
          type: "hold_placed",
          label: "Retención de fianza autorizada (auth-only, sin captura)",
          amount: booking?.securityDepositAmount,
          currency: booking?.currency,
          transactionId: result.transactionId,
          source: "system",
        });
      },

      releaseHold: async (bookingId) => {
        const booking = state.bookings[bookingId];
        if (!booking?.holdTransactionId) return { ok: false, error: "no_hold" };
        const { ok, data } = await postJson<{ error?: string }>("/api/nuvei/void", {
          relatedTransactionId: booking.holdTransactionId,
        });
        if (!ok) return { ok: false, error: data.error };

        updateBooking(bookingId, { status: "hold_released" });
        addEvent(bookingId, {
          type: "hold_released",
          label: "Fianza liberada (void de la autorización)",
          source: "admin",
        });
        return { ok: true };
      },

      captureHold: async (bookingId, amount) => {
        const booking = state.bookings[bookingId];
        if (!booking?.holdTransactionId) return { ok: false, error: "no_hold" };
        const { ok, data } = await postJson<{ result?: { transactionId?: string }; error?: string }>(
          "/api/nuvei/capture",
          {
            relatedTransactionId: booking.holdTransactionId,
            amount: amountForNuvei(amount),
            currency: booking.currency,
          }
        );
        if (!ok) return { ok: false, error: data.error };

        updateBooking(bookingId, { status: "hold_claimed" });
        addEvent(bookingId, {
          type: "hold_claimed",
          label: `Daños reclamados: captura parcial de la fianza (${amount} de ${booking.securityDepositAmount})`,
          amount,
          currency: booking.currency,
          transactionId: data.result?.transactionId,
          source: "admin",
        });
        return { ok: true };
      },

      refundBooking: async (bookingId, amount) => {
        const booking = state.bookings[bookingId];
        if (!booking) return { ok: false, error: "not_found" };
        const paidTxnId = booking.transactionIds.sale || booking.transactionIds.deposit;
        const paidAmount = booking.transactionIds.sale ? booking.totalAmount : booking.depositAmount;
        if (!paidTxnId || !paidAmount) return { ok: false, error: "nothing_to_refund" };

        const refundAmount = amount && amount > 0 && amount <= paidAmount ? amount : paidAmount;
        const { ok, data } = await postJson<{ result?: { transactionId?: string }; error?: string }>(
          "/api/nuvei/refund",
          {
            relatedTransactionId: paidTxnId,
            amount: amountForNuvei(refundAmount),
            currency: booking.currency,
          }
        );
        if (!ok) return { ok: false, error: data.error };

        updateBooking(bookingId, {
          status: refundAmount >= paidAmount ? "refunded" : "partially_refunded",
          refundedAmount: refundAmount,
          transactionIds: { ...booking.transactionIds, refund: data.result?.transactionId || "" },
        });
        addEvent(bookingId, {
          type: "refunded",
          label:
            refundAmount >= paidAmount
              ? "Reembolso completo procesado"
              : `Reembolso parcial procesado (${Math.round((refundAmount / paidAmount) * 100)}%)`,
          amount: refundAmount,
          currency: booking.currency,
          transactionId: data.result?.transactionId,
          source: "admin",
        });
        return { ok: true, refundAmount };
      },

      cancelBooking: async (bookingId) => {
        const booking = state.bookings[bookingId];
        if (!booking) return { ok: false, error: "not_found" };

        const paidTxnId = booking.transactionIds.sale || booking.transactionIds.deposit;
        const paidAmount = booking.transactionIds.sale ? booking.totalAmount : booking.depositAmount;

        if (!paidTxnId || !paidAmount) {
          // Nothing was ever charged — just mark cancelled, no Nuvei call needed.
          updateBooking(bookingId, { status: "cancelled" });
          addEvent(bookingId, {
            type: "cancelled",
            label: "Reserva cancelada antes de completar el pago",
            source: "guest",
          });
          return { ok: true };
        }

        const withinFreeWindow = new Date() <= new Date(booking.freeCancellationUntil);
        const refundAmount = withinFreeWindow
          ? paidAmount
          : Math.round((paidAmount * booking.cancellationPolicyPct) / 100 * 100) / 100;

        const { ok, data } = await postJson<{ result?: { transactionId?: string }; error?: string }>(
          "/api/nuvei/refund",
          {
            relatedTransactionId: paidTxnId,
            amount: amountForNuvei(refundAmount),
            currency: booking.currency,
          }
        );
        if (!ok) return { ok: false, error: data.error };

        addEvent(bookingId, {
          type: "cancelled",
          label: withinFreeWindow
            ? "Cancelada dentro del plazo de cancelación gratuita"
            : "Cancelada fuera del plazo de cancelación gratuita",
          source: "guest",
        });

        updateBooking(bookingId, {
          status: withinFreeWindow ? "refunded" : "partially_refunded",
          refundedAmount: refundAmount,
          transactionIds: { ...booking.transactionIds, refund: data.result?.transactionId || "" },
        });
        addEvent(bookingId, {
          type: "refunded",
          label: withinFreeWindow
            ? "Reembolso completo procesado"
            : `Reembolso parcial procesado (${booking.cancellationPolicyPct}%)`,
          amount: refundAmount,
          currency: booking.currency,
          transactionId: data.result?.transactionId,
          source: "system",
        });

        return { ok: true, refundAmount, withinFreeWindow };
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within BookingsProvider");
  return ctx;
}
