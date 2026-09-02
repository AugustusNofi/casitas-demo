import BookingConfirmation from "@/components/BookingConfirmation";

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingConfirmation bookingId={id} />;
}
