import { NextResponse } from "next/server";
import { refundTransaction, nuveiConfigured } from "@/lib/nuvei";

// Stateless proxy: full or partial refund of a settled transaction (flow 4, both guest
// self-cancel and the admin manual-refund override).
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

  const result = await refundTransaction({ relatedTransactionId, amount, currency });

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: "refund_failed", detail: result }, { status: 502 });
}
