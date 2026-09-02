"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutReturnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (cancelled) return;

      if (data.booking && data.booking.status !== "pending") {
        router.replace(`/booking/${id}/confirmation`);
        return;
      }

      if (attempts < 15) {
        setTimeout(() => setAttempts((a) => a + 1), 1500);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, id]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sand-200 border-t-coral-500" />
      <p className="mt-4 font-display text-lg font-bold text-ink-900">
        Confirmando tu pago con Nuvei…
      </p>
      <p className="mt-1 text-sm text-ink-700">
        Esto puede tardar unos segundos mientras recibimos la notificación del pago (DMN).
      </p>
      {attempts >= 15 && (
        <a
          href={`/booking/${id}`}
          className="mt-4 rounded-full bg-coral-500 px-5 py-2 text-sm font-bold text-white"
        >
          Ver estado de la reserva
        </a>
      )}
    </div>
  );
}
