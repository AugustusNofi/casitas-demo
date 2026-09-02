import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/ensure-seed";
import { getAllListings } from "@/lib/kv";

export async function GET() {
  await ensureSeeded();
  const listings = await getAllListings();
  return NextResponse.json({ listings });
}
