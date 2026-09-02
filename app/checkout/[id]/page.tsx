import CheckoutFlow from "@/components/CheckoutFlow";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Finalizar reserva</h1>
      <CheckoutFlow bookingId={id} />
    </div>
  );
}
