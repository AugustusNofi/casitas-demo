import { NextResponse } from "next/server";
import { settleTransaction, nuveiConfigured } from "@/lib/nuvei";

// Stateless proxy: captures (settles) part or all of a prior authorization. Used both for
// flow 1's underlying settle-after-auth (handled by Simply Connect itself) and, explicitly,
// flow 3's "claim damages" partial capture of a security-deposit hold.
export async function POST(req: Request) {
  const { relatedTransactionId, amount, currency } = (await req.json()) as {
    relatedTransactionId: string;
    amount: string;
    currency: string;
  };

  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }
  if (!relatedTransactionId || !amount || !currency) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const result = await settleTransaction({ relatedTransactionId, amount, currency });

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: "capture_failed", detail: result }, { status: 502 });
}
