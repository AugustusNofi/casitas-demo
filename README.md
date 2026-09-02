# Casitas — Nuvei payments demo for a vacation-rental / OTA marketplace

Casitas is a fictional, joyful vacation-rental marketplace (apartments, villas, casas rurales
across Spain and Europe) built to showcase five distinct real payment flows a travel/OTA
platform needs, using **Nuvei's Web SDK in the sandbox environment** — custom-built, on-brand
card fields rather than Nuvei's hosted Simply Connect widget. UX/layout takes inspiration from
Holidu.es (search-bar hero, popular-search pills, property card format) but no Holidu branding,
copy, or photos are used — this is an original demo brand.

**This is a sandbox demo. No real money moves.**

## The five payment flows

1. **Instant booking checkout** — full-stay card payment with real 3DS2, via Nuvei's Web SDK:
   custom-styled card number / expiration / CVV fields (not a hosted widget). `/checkout/[id]` →
   confirmation with a real Nuvei transaction ID.
2. **Deposit + balance (card-on-file rebilling)** — pay 30% now, the card is tokenized
   (`userTokenId` + `userPaymentOptionId`), and the back office can trigger the remaining-balance
   charge on the stored token with no card re-entry (simulates the scheduled date arriving).
3. **Security deposit hold (auth vs. capture)** — an authorization-only hold at simulated
   check-in, with back-office actions to release it (void) or claim damages (partial capture).
4. **Cancellation / refund** — guest self-service cancellation: full refund inside the free-
   cancellation window, policy-percentage partial refund outside it. Admin also has a manual
   refund override.
5. **Multi-currency** — an EUR/GBP/USD switcher re-prices listings and carries through to the
   actual amount charged at checkout (display/charge currency vs. the merchant's settlement
   currency).

A small **Casitas Payments** back office (`/admin`) shows all bookings, a payment lifecycle
timeline per booking, and the action buttons for flows 2–4.

## Tech stack — no external database

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.
- **All booking state lives in the browser.** `app/providers.tsx` (`BookingsProvider`) holds it
  in React state, seeded on first load from `data/seed-bookings.json`, and persists it to
  `sessionStorage` — a refresh mid-demo keeps everything, a fresh tab starts clean from the
  seed data. There is no server-side database: `data/listings.json` and
  `data/seed-bookings.json` ship as static files in the repo, and that's the entire "backend."
- `app/api/nuvei/*` are **stateless proxies** — `open-order`, `capture`, `void`, `refund`,
  `rebill`. Each one takes exactly what it needs, calls Nuvei via `lib/nuvei.ts` (direct REST
  API v1 calls, checksum computed with Node's `crypto`), and returns the raw result. None of
  them read or write anything — the client (`BookingsProvider`'s actions) receives the response
  and updates its own state with the real Nuvei transaction id / status.
  (Note: the brief referenced an `nuvei-server-nodejs` npm package — it doesn't exist on the
  registry, so this talks to Nuvei's REST v1 API directly instead.)
- **Nuvei Web SDK** (not Simply Connect): `/openOrder` → `sessionToken`, then the frontend
  (`components/NuveiWebSdkCheckout.tsx`) calls `SafeCharge({...sessionToken}).fields()` to mount
  three individually hosted, PCI-compliant iframe fields — card number, expiration, CVV — styled
  to match the app, and `createPayment()` to submit. 3D Secure 2 runs automatically inside that
  call (Nuvei manages the challenge iframe/popup itself). The callback result updates
  `BookingsProvider` state directly — there's no DMN webhook or server-side polling, since
  there's no store for either to update.

## Setup

### 1. Install and configure

```bash
npm install
cp .env.example .env   # then fill in real values — .env is git-ignored
```

Required in `.env`:

| Variable | Where to get it |
|---|---|
| `NUVEI_MERCHANT_ID`, `NUVEI_MERCHANT_SITE_ID`, `NUVEI_SECRET_KEY` | Nuvei sandbox merchant account |
| `NUVEI_ENV` | `int` for sandbox |
| `ADMIN_PASSCODE` | any string you choose — gates `/admin` |
| `GEMINI_API_KEY` | Optional — for `scripts/generate-images.js`. Without it (or if the account has no image-generation quota), the app uses generated SVG placeholders automatically. |

That's it — no database credentials of any kind.

### 2. Images (already generated)

```bash
npm run generate-images
```

Calls Gemini's `gemini-2.5-flash-image` per `scripts/image-manifest.js` and writes into
`public/images/`; skips files that already exist. In this repo, the configured Gemini key had
zero image-generation quota, so `/public/images/*` currently contains the SVG placeholder
fallback (coral/teal duotone graphics) — the app is fully functional and looks intentional this
way. To get real photos: get a Gemini key with image quota, put it in `.env`, delete the
placeholder files you want replaced, and rerun the script.

### 3. Run locally

```bash
npm run dev
```

Listings load straight from `data/listings.json`. Bookings seed themselves into
`BookingsProvider` from `data/seed-bookings.json` on first load in a given browser tab — no
setup step needed, and it works identically in `next dev` and once deployed. Real Nuvei sandbox
credentials in `.env` are needed for the payment flows to actually call Nuvei.

## Deploying

```bash
vercel link            # first time only, if not already linked
vercel deploy --prod
```

Set the same env vars (Nuvei creds, `ADMIN_PASSCODE`) in the Vercel project's environment
variables. No storage/database resource needs to be provisioned — this app has none.

### Nuvei-side configuration to check before a live demo

- **Domain whitelisting**: confirm the deployed domain is allowed for Web SDK / 3DS2 redirect
  flows in the Nuvei Control Panel for this merchant site.
- **3DS2**: should run for real in sandbox once the merchant account is 3DS2-enabled — no
  mocking involved. Get current sandbox test card numbers from Nuvei's Testing Cards page.

## Known scope notes

- Spanish is the only shipped language (the brief listed an English toggle as optional; it was
  cut to prioritize the five payment flows and back office within scope).
- Multi-currency (flow 5) is a display/charge-currency demo using a static FX table, not real
  cross-account settlement — the checkout page explains this distinction on screen.
- **Web SDK is card-only in this build.** Switching from Simply Connect (a hosted widget that
  bundled card + Bizum + PayPal + wallets) to the raw Web SDK means each payment method needs
  its own explicit integration — there's no single "show all methods" call. Card is fully wired
  up (fields, 3DS2, tokenization). PayPal has a confirmed method code
  (`apmgw_expresscheckout`) but needs its own redirect flow; Apple Pay / Google Pay have their
  own separate SDK modules (`ppp_ApplePay` / `ppp_GooglePay`) with domain-verification and
  merchant-ID setup on Nuvei's side; Bizum doesn't appear anywhere in the Web SDK bundle at all
  in this inspection, so it may only be available via Simply Connect or the Cashier/Payment Page
  product — not guessed at here rather than risk a silently-broken option.
- `components/NuveiWebSdkCheckout.tsx`'s API calls (`SafeCharge()`, `.fields().create()`,
  `.attach()`, `.createPayment()`) were confirmed by downloading and reading the actual
  `safecharge.js` (Web SDK) bundle source after the docs search tool went down mid-build — the
  same technique that caught two real bugs in the Simply Connect integration earlier. The field
  styling options (`style.base/focus/invalid`) are the one part taken from general convention
  rather than bundle-confirmed, since no live browser was available to visually verify — smoke
  test the actual field rendering after deploying.
- **No server-side persistence, by design.** Booking state lives per-browser-tab
  (`sessionStorage`); it isn't shared across devices or visible to anyone else, and two people
  opening the same booking URL in different browsers each see their own local copy. For this
  demo's purpose — showing a room the payment flows working live against Nuvei sandbox — that's
  the intended tradeoff. A production system would need a real backend for this.
