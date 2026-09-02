import { NextResponse } from "next/server";
import { chargeStoredPaymentOption, nuveiConfigured } from "@/lib/nuvei";

// Stateless proxy: charges a previously tokenized card (flow 2's balance charge) using
// userTokenId + userPaymentOptionId, no card re-entry.
export async function POST(req: Request) {
  const { userTokenId, userPaymentOptionId, amount, currency } = (await req.json()) as {
    userTokenId: string;
    userPaymentOptionId: string;
    amount: string;
    currency: string;
  };

  if (!nuveiConfigured()) {
    return NextResponse.json({ error: "nuvei_not_configured" }, { status: 503 });
  }
  if (!userTokenId || !userPaymentOptionId || !amount || !currency) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const result = await chargeStoredPaymentOption({ userTokenId, userPaymentOptionId, amount, currency });

  if (result.status === "SUCCESS" || result.transactionStatus === "APPROVED") {
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json({ error: "rebill_failed", detail: result }, { status: 502 });
}
