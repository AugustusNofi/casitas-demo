# Casitas — Nuvei payments demo for a vacation-rental / OTA marketplace

Casitas is a fictional, joyful vacation-rental marketplace (apartments, villas, casas rurales
across Spain and Europe) built to showcase five distinct real payment flows a travel/OTA
platform needs, using **Nuvei's Web SDK (Simply Connect 1.0) in the sandbox environment**.
UX/layout takes inspiration from Holidu.es (search-bar hero, popular-search pills, property
card format) but no Holidu branding, copy, or photos are used — this is an original demo brand.

**This is a sandbox demo. No real money moves.**

## The five payment flows

1. **Instant booking checkout** — full-stay payment via card (3DS2), Bizum, PayPal, Apple Pay /
   Google Pay, via Nuvei Simply Connect. `/checkout/[id]` → confirmation with a real Nuvei
   transaction ID.
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

A small **Casitas Payments** back office (`/admin`) shows all bookings, a Nuvei-DMN-driven
payment lifecycle timeline per booking, the raw transaction/DMN log, and the action buttons for
flows 2–4.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.
- Server logic in Route Handlers under `app/api/*`.
- `lib/nuvei.ts` — direct REST API v1 calls (checksum computed with Node's `crypto`) for
  `openOrder`, `settleTransaction`, `voidTransaction`, `refundTransaction`, and rebilling a
  stored payment option. (Note: the brief referenced an `nuvei-server-nodejs` npm package —
  it doesn't exist on the registry, so this talks to Nuvei's REST v1 API directly instead.)
- Nuvei Web SDK (Simply Connect 1.0: `/openOrder` → `sessionToken` → frontend `checkout()`)
  renders the actual payment UI in `components/NuveiCheckout.tsx`.
- Nuvei DMN webhook (`/api/webhooks/nuvei/dmn`) is the **authoritative** source of truth for
  status changes — correlated back to a booking via `userTokenId`, which every `/openOrder`
  call sets to the booking id. The browser redirect after checkout is just UX polling; DMN is
  what actually updates state.
- Vercel-managed Redis (Upstash, via `@upstash/redis`) for listings/bookings/timeline
  events/transaction log. Falls back to an in-memory store per process when unconfigured, so
  `next dev` still runs without it — but note that fallback is **not reliable across Next.js's
  separate route bundles in dev**, so provision real Redis before doing anything beyond a quick
  look.

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
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally; the deployed HTTPS URL in production. **Must be HTTPS** for Nuvei's redirect/DMN URLs to be accepted — the app silently skips them over HTTP. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | From the Vercel-managed Redis store (Vercel dashboard → Storage, or `vercel env pull .env.local` once provisioned) |
| `GEMINI_API_KEY` | Optional — for `scripts/generate-images.js`. Without it (or if the account has no image-generation quota), the app uses generated SVG placeholders automatically. |

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

Listings and demo bookings seed themselves automatically on first request (`lib/ensure-seed.ts`)
against whatever store is configured — real Redis if `UPSTASH_REDIS_REST_URL`/`TOKEN` are set,
otherwise the in-memory fallback. You can also force a seed with `npm run seed`.

Payment flows need real Nuvei sandbox credentials in `.env` to actually call `/openOrder`; the
DMN webhook and redirect URLs only work once the app is deployed on a public HTTPS URL Nuvei can
reach (see the HTTPS note above).

## Deploying

```bash
vercel link            # first time only
vercel env pull .env.local   # after provisioning the Redis store, to get Upstash creds locally
vercel deploy --prod
```

Set the same env vars (Nuvei creds, `ADMIN_PASSCODE`, `NEXT_PUBLIC_APP_URL` = the production
URL) in the Vercel project's environment variables.

### Nuvei-side configuration to check before a live demo

- **Domain whitelisting**: confirm the deployed domain is allowed for Simply Connect / 3DS2
  redirect flows in the Nuvei Control Panel for this merchant site.
- **DMN URL**: either rely on the per-request `urlDetails.notificationUrl` this app already
  sends (built from `NEXT_PUBLIC_APP_URL`), or additionally register the same
  `https://<your-domain>/api/webhooks/nuvei/dmn` URL in the Control Panel's integration
  settings as a fallback.
- **3DS2**: should run for real in sandbox once the merchant account is 3DS2-enabled — no
  mocking involved. Get current sandbox test card numbers from Nuvei's Testing Cards page.
- **Apple Pay / Google Pay**: both are offered as selectable methods in the widget, but Apple
  Pay needs Apple domain-association hosting + a merchant identity cert, and both wallets need
  merchant IDs configured on Nuvei's side beyond basic sandbox card testing. Card, Bizum, and
  PayPal are the flows guaranteed to complete end-to-end without extra setup.

## Known scope notes

- Spanish is the only shipped language (the brief listed an English toggle as optional; it was
  cut to prioritize the five payment flows and back office within scope).
- Multi-currency (flow 5) is a display/charge-currency demo using a static FX table, not real
  cross-account settlement — the checkout page explains this distinction on screen.
- The `checkout()` JS call in `components/NuveiCheckout.tsx` was verified directly against
  Nuvei's actual `checkout.js` bundle (downloaded and inspected — its own internal validator
  requires `renderTo`, `amount`, `currency`, `country`, `sessionToken`, `merchantId`,
  `merchantSiteId`), not just the docs example, after the docs search tool went down mid-build.
  Still worth a smoke test after deploying since that inspection covered the config shape, not
  every payment-method-specific edge case.
