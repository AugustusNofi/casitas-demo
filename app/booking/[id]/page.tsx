import { notFound } from "next/navigation";
import { getBooking, getTimeline } from "@/lib/kv";
import BookingStatusPanel from "@/components/BookingStatusPanel";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();
  const timeline = await getTimeline(id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <BookingStatusPanel booking={booking} timeline={timeline} />
    </div>
  );
}
