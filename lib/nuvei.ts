import crypto from "crypto";

// Nuvei REST API v1 — used for /openOrder (paired with Simply Connect 1.0's checkout()
// on the frontend) plus the server-side financial operations (settle/void/refund) that
// the back office triggers. All calls happen only in server route handlers.
//
// Docs consulted: docs.nuvei.com — Simply Connect Quick Start, Financial Operations
// (Auth & Settle, Void, Refund), Card Operations (Zero Authorization, PCI & Tokenization),
// Webhooks (DMN). Host + checksum formula verified against the real sandbox account.

const HOSTS: Record<string, string> = {
  int: "https://ppp-test.nuvei.com/ppp/api/v1",
  sandbox: "https://ppp-test.nuvei.com/ppp/api/v1",
  prod: "https://secure.nuvei.com/ppp/api/v1",
};

function getEnv() {
  const merchantId = process.env.NUVEI_MERCHANT_ID;
  const merchantSiteId = process.env.NUVEI_MERCHANT_SITE_ID;
  const secretKey = process.env.NUVEI_SECRET_KEY;
  const env = process.env.NUVEI_ENV || "int";

  if (!merchantId || !merchantSiteId || !secretKey) {
    return null;
  }

  return { merchantId, merchantSiteId, secretKey, host: HOSTS[env] || HOSTS.int };
}

export function nuveiConfigured() {
  return getEnv() !== null;
}

function timeStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(
    d.getUTCHours()
  )}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

function sha256(raw: string) {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

function uniqueId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function post(path: string, body: Record<string, unknown>) {
  const cfg = getEnv();
  if (!cfg) {
    throw new Error(
      "Nuvei credentials are not configured (NUVEI_MERCHANT_ID / NUVEI_MERCHANT_SITE_ID / NUVEI_SECRET_KEY)."
    );
  }
  const res = await fetch(`${cfg.host}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { cfg, json, ok: res.ok };
}

export interface OpenOrderParams {
  amount: string;
  currency: string;
  userTokenId?: string;
  transactionType?: "Sale" | "Auth";
  notificationUrl?: string;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
  // Nuvei's DMN payload isn't confirmed to echo back userTokenId, but it does echo
  // merchant_unique_id — so callers should pass a value they can parse a booking id back
  // out of. Falls back to a random id if omitted.
  clientUniqueId?: string;
}

export async function openOrder(params: OpenOrderParams) {
  const cfg = getEnv();
  if (!cfg) throw new Error("Nuvei not configured");

  const clientRequestId = uniqueId("req");
  const clientUniqueId = params.clientUniqueId || uniqueId("ord");
  const ts = timeStamp();
  const raw =
    cfg.merchantId + cfg.merchantSiteId + clientRequestId + params.amount + params.currency + ts + cfg.secretKey;
  const checksum = sha256(raw);

  const body: Record<string, unknown> = {
    merchantId: cfg.merchantId,
    merchantSiteId: cfg.merchantSiteId,
    clientRequestId,
    clientUniqueId,
    amount: params.amount,
    currency: params.currency,
    timeStamp: ts,
    checksum,
  };
  if (params.userTokenId) body.userTokenId = params.userTokenId;
  if (params.transactionType) body.transactionType = params.transactionType;
  if (params.notificationUrl || params.successUrl || params.failureUrl || params.pendingUrl) {
    body.urlDetails = {
      notificationUrl: params.notificationUrl,
      successUrl: params.successUrl,
      failureUrl: params.failureUrl,
      pendingUrl: params.pendingUrl,
    };
  }

  const { json } = await post("/openOrder.do", body);
  return json as {
    status: string;
    sessionToken?: string;
    orderId?: string;
    reason?: string;
    err_code?: number;
  };
}

// settle/void/refund checksums are keyed on `clientUniqueId` (not `clientRequestId` — unlike
// /openOrder). Verified live against the sandbox: a dummy relatedTransactionId with this
// formula returns errCode 1082 "Invalid value of relatedTransactionId" (a domain error), not
// 1001 "Invalid checksum" — confirming the field order below is correct.

export async function settleTransaction(params: {
  relatedTransactionId: string;
  amount: string;
  currency: string;
}) {
  const cfg = getEnv();
  if (!cfg) throw new Error("Nuvei not configured");

  const clientUniqueId = uniqueId("settle");
  const ts = timeStamp();
  const raw =
    cfg.merchantId +
    cfg.merchantSiteId +
    clientUniqueId +
    params.amount +
    params.currency +
    params.relatedTransactionId +
    ts +
    cfg.secretKey;
  const checksum = sha256(raw);

  const { json } = await post("/settleTransaction.do", {
    merchantId: cfg.merchantId,
    merchantSiteId: cfg.merchantSiteId,
    clientUniqueId,
    amount: params.amount,
    currency: params.currency,
    relatedTransactionId: params.relatedTransactionId,
    timeStamp: ts,
    checksum,
  });
  return json as { status: string; transactionStatus?: string; transactionId?: string; reason?: string };
}

export async function voidTransaction(params: { relatedTransactionId: string }) {
  const cfg = getEnv();
  if (!cfg) throw new Error("Nuvei not configured");

  const clientUniqueId = uniqueId("void");
  const ts = timeStamp();
  const raw =
    cfg.merchantId + cfg.merchantSiteId + clientUniqueId + params.relatedTransactionId + ts + cfg.secretKey;
  const checksum = sha256(raw);

  const { json } = await post("/voidTransaction.do", {
    merchantId: cfg.merchantId,
    merchantSiteId: cfg.merchantSiteId,
    clientUniqueId,
    relatedTransactionId: params.relatedTransactionId,
    timeStamp: ts,
    checksum,
  });
  return json as { status: string; transactionStatus?: string; transactionId?: string; reason?: string };
}

export async function refundTransaction(params: {
  relatedTransactionId: string;
  amount: string;
  currency: string;
}) {
  const cfg = getEnv();
  if (!cfg) throw new Error("Nuvei not configured");

  const clientUniqueId = uniqueId("refund");
  const ts = timeStamp();
  const raw =
    cfg.merchantId +
    cfg.merchantSiteId +
    clientUniqueId +
    params.amount +
    params.currency +
    params.relatedTransactionId +
    ts +
    cfg.secretKey;
  const checksum = sha256(raw);

  const { json } = await post("/refundTransaction.do", {
    merchantId: cfg.merchantId,
    merchantSiteId: cfg.merchantSiteId,
    clientUniqueId,
    amount: params.amount,
    currency: params.currency,
    relatedTransactionId: params.relatedTransactionId,
    timeStamp: ts,
    checksum,
  });
  return json as { status: string; transactionStatus?: string; transactionId?: string; reason?: string };
}

// Rebilling a stored card (flow 2 balance charge) — a Payment API call using the UPO
// returned from the original Sale, no card re-entry.
export async function chargeStoredPaymentOption(params: {
  userTokenId: string;
  userPaymentOptionId: string;
  amount: string;
  currency: string;
}) {
  const cfg = getEnv();
  if (!cfg) throw new Error("Nuvei not configured");

  const clientRequestId = uniqueId("rebill");
  const ts = timeStamp();
  const raw =
    cfg.merchantId + cfg.merchantSiteId + clientRequestId + params.amount + params.currency + ts + cfg.secretKey;
  const checksum = sha256(raw);

  const { json } = await post("/payment.do", {
    merchantId: cfg.merchantId,
    merchantSiteId: cfg.merchantSiteId,
    clientRequestId,
    clientUniqueId: clientRequestId,
    amount: params.amount,
    currency: params.currency,
    userTokenId: params.userTokenId,
    paymentOption: { userPaymentOptionId: params.userPaymentOptionId },
    timeStamp: ts,
    checksum,
  });
  return json as {
    status: string;
    transactionStatus?: string;
    transactionId?: string;
    reason?: string;
  };
}

export function getDmnNotificationUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/webhooks/nuvei/dmn`;
}
