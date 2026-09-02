import BookingStatusPanel from "@/components/BookingStatusPanel";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BookingStatusPanel bookingId={id} />
    </div>
  );
}
