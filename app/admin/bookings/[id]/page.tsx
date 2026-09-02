import { notFound } from "next/navigation";
import { getBooking, getTimeline, getTransactionLog } from "@/lib/kv";
import { formatMoney } from "@/lib/pricing";
import Timeline from "@/components/Timeline";
import AdminBookingActions from "@/components/AdminBookingActions";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();
  const timeline = await getTimeline(id);
  const txnLog = await getTransactionLog(id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Reserva {booking.id}</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">{booking.listingTitle}</h1>
      <p className="mt-1 text-sm text-ink-700">
        {booking.guestName} ({booking.guestEmail}) ·{" "}
        {new Date(booking.checkIn).toLocaleDateString("es-ES")} →{" "}
        {new Date(booking.checkOut).toLocaleDateString("es-ES")} · {booking.guests} huéspedes
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Total</p>
          <p className="font-semibold">{formatMoney(booking.totalAmount, booking.currency)}</p>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Estado</p>
          <p className="font-semibold">{booking.status}</p>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Flujo</p>
          <p className="font-semibold capitalize">{booking.flow.replace("_", " ")}</p>
        </div>
        <div className="rounded-xl border border-sand-200 bg-white p-3">
          <p className="text-[11px] uppercase text-ink-700">Token de red / UPO</p>
          <p className="truncate font-mono text-xs font-semibold">
            {booking.userPaymentOptionId || "—"}
            {booking.cardLast4 && ` (${booking.cardBrand || "tarjeta"} ····${booking.cardLast4})`}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-ink-900">Acciones</h2>
          <AdminBookingActions booking={booking} />

          <h2 className="mb-3 mt-6 font-display text-lg font-bold text-ink-900">
            Registro sin procesar (Nuvei) · {txnLog.length} eventos
          </h2>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-sand-200 bg-ink-900 p-3">
            {txnLog.length === 0 && <p className="text-xs text-sand-100/70">Sin llamadas registradas todavía.</p>}
            {txnLog.map((t, i) => (
              <details key={i} className="text-xs text-sand-100">
                <summary className="cursor-pointer font-mono">
                  {new Date(t.at).toLocaleTimeString("es-ES")} · {t.kind}
                </summary>
                <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-teal-300">
                  {JSON.stringify(t.payload, null, 2)}
                </pre>
              </details>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-ink-900">Ciclo de vida del pago</h2>
          <Timeline events={timeline} />
        </div>
      </div>
    </div>
  );
}
