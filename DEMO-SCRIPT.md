# Casitas — live demo script

A suggested click-path through all five Nuvei payment flows, ~10–12 minutes. Do the smoke test
first, privately, before presenting.

## Before the room: smoke test

1. Open the deployed URL in a fresh browser tab. Confirm the sandbox banner shows at the top,
   and that `/admin` already lists the seeded demo bookings (loaded from
   `data/seed-bookings.json` — no setup step needed).
2. Go to a listing → Reservar → checkout. Confirm the three Nuvei Web SDK card fields (number,
   expiration, CVV) actually render and accept input, and click one of the 3DS2 scenario buttons
   to confirm it actually fills those fields (`setValue()`) rather than just copying to the
   clipboard — none of this was visually verified without a live browser during the build.
3. Run the Frictionless scenario through end to end and confirm it lands on the confirmation
   page and the booking's timeline shows the new event — this all happens client-side via the
   widget's `onResult` callback, so this also proves that's wired up. Then try Challenge and
   confirm the 3DS popup/iframe actually appears.
4. Log into `/admin` with your `ADMIN_PASSCODE` and confirm that same booking shows up. Note
   this state is per-browser-tab (`sessionStorage`) — refreshing keeps it, but a different
   browser/device won't see it. Do the whole demo in one tab.

## 1. Search & browse (context-setting, ~1 min)

- Home page: point out the search bar, "Búsquedas populares" pills, destination grid — call out
  it's original branding/photography (SVG placeholders or generated images), inspired by but not
  copying any real OTA.
- Click into a destination, then a property card. Show the listing page: gallery, amenities,
  cancellation policy, price breakdown.

## 2. Flow 1 — Instant booking checkout (~2 min)

- On a listing (pick one with free cancellation, e.g. a Costa Brava villa), fill dates/guests,
  enter a name + email, click **Reservar**.
- On `/checkout/[id]`, leave "Pagar el total ahora" selected.
- Point out the card fields are custom-built via Nuvei's Web SDK (not a hosted widget) — styled
  to match the Casitas brand, each one a separately hosted, PCI-compliant iframe.
- Complete payment with a Nuvei sandbox test card that triggers 3DS2 — narrate the challenge
  step as it happens (Nuvei's SDK manages it automatically).
- Land on the confirmation page: point out the real Nuvei transaction ID.

## 3. Flow 2 — Deposit + balance / card-on-file rebilling (~2 min)

- Book a second listing. On checkout, select **"Pagar el 30% ahora, el resto más tarde"**.
- Complete the deposit payment with a test card.
- Go to `/admin`, open that booking. Point out the stored `userPaymentOptionId` / masked card
  shown on the detail page — the card is tokenized, not stored by us.
- Click **"Simular: ejecutar cobro programado"** to charge the remaining balance — no card
  re-entry. Show the timeline updating to "Saldo restante cobrado automáticamente."

## 4. Flow 3 — Security deposit hold (auth vs. capture) (~2 min)

- Open a paid booking's guest page (`/booking/[id]`) and click **"Simular check-in"**.
- Complete the auth-only hold payment — narrate that this is an authorization, not a charge; no
  funds move yet.
- In `/admin`, open the booking. Show two options:
  - **Liberar fianza (void)** — releases the hold entirely, or
  - **Reclamar daños (captura)** — enter a partial amount and capture only that much.
- Pick one live and show the resulting status + timeline event.

## 5. Flow 4 — Cancellation / refund (~2 min)

- On a different paid booking's guest page, click **"Cancelar reserva"**.
- If within the free-cancellation window: show the full refund fire and the timeline event.
- To show the outside-window case without waiting days, open a booking whose
  `freeCancellationUntil` has already passed (or use the admin manual refund override on
  `/admin/bookings/[id]` to demonstrate the same refund API call from the back-office side).

## 6. Flow 5 — Multi-currency (~1–2 min)

- Back on `/search`, use the EUR/GBP/USD switcher in the nav. Show prices re-pricing across the
  grid and the listing page.
- Start a checkout in GBP or USD and show the amount charged to Nuvei is in that currency —
  mention the on-screen note about display/charge currency vs. the merchant's settlement
  currency.

## 7. Wrap-up (~1 min)

- Back in `/admin`, show the bookings table with the full spread of statuses now present
  (pending, deposit paid, paid in full, hold active, refunded, cancelled), and point out that
  every transaction id shown on a booking detail page is a real id Nuvei returned — the app has
  no database of its own, it's all state in this browser tab kept in sync with what Nuvei
  actually did.

## Test cards / 3DS2 scenarios

Every checkout screen (instant/deposit payment and the check-in security-deposit hold) shows a
"🧪 Escenarios de prueba 3DS2 (sandbox Nuvei)" picker right above the card fields, with three
one-click buttons. Clicking one fills the cardholder name field and the three secure card fields
(number/expiry/CVV) automatically via the Web SDK's `setValue()`, and copies the card number to
the clipboard as a fallback. Nuvei's sandbox reads the **cardholder name**, not just the card
number, to decide which 3DS behavior to simulate — all three combinations below are taken
verbatim from Nuvei's Testing Cards documentation
(docs.nuvei.com/documentation/integration/testing/testing-cards/):

| Scenario | Brand | Card number | Cardholder name | Expiry | CVV |
|---|---|---|---|---|---|
| Normal (sin 3DS) | Visa | 4000027891380961 | Jane Smith | 12/30 | 217 |
| 3DS2 — Frictionless | Visa | 4000020951595032 | FL-BRW1 | 12/30 | 217 |
| 3DS2 — Challenge | Mastercard | 2221008123677736 | CL-BRW2 | 12/26 | 123 |

For a guaranteed decline or other scenarios beyond these three, pull the current numbers from
the same Testing Cards page in your Nuvei account.
