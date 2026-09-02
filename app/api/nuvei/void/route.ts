import { NextResponse } from "next/server";
import { voidTransaction, nuveiConfigured } from "@/lib/nuvei";

// Stateless proxy: releases a prior authorization (flow 3's "release hold").
export async function POST(req: Request) {
  const { relatedTransactionId } = (await req.json()) as { relatedTransactionId: string };

  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }
  if (!relatedTransactionId) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const result = await voidTransaction({ relatedTransactionId });

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: "void_failed", detail: result }, { status: 502 });
}
