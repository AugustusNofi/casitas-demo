import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/ensure-seed";
import { getListing } from "@/lib/kv";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
}
