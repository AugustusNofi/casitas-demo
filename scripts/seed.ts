// Seeds Vercel-managed Upstash Redis with fixture listings and demo bookings.
// Run with `npm run seed`. Safe to re-run — writes are idempotent (same ids).
import "dotenv/config";
import { saveListing, saveBooking, appendTimelineEvent, markSeeded } from "../lib/kv";
import { getFixtureListings, getFixtureBookings } from "../lib/fixtures";

async function main() {
  const listings = getFixtureListings();
  for (const listing of listings) {
    await saveListing(listing);
  }
  console.log(`Seeded ${listings.length} listings.`);

  const bookings = getFixtureBookings();
  for (const { booking, events } of bookings) {
    await saveBooking(booking);
    for (const event of events) {
      await appendTimelineEvent(event);
    }
  }
  console.log(`Seeded ${bookings.length} demo bookings.`);

  await markSeeded();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
