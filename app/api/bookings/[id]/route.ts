import { NextResponse } from "next/server";
import { getBooking, getTimeline } from "@/lib/kv";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const timeline = await getTimeline(id);
  return NextResponse.json({ booking, timeline });
}
