import { isSeeded, markSeeded, saveListing, saveBooking, appendTimelineEvent } from "./kv";
import { getFixtureListings, getFixtureBookings } from "./fixtures";

let seedingPromise: Promise<void> | null = null;

// Lazily seeds the store on first read so the demo works immediately after deploy,
// without requiring a manual `npm run seed` against production KV.
export async function ensureSeeded(): Promise<void> {
  if (await isSeeded()) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    for (const listing of getFixtureListings()) {
      await saveListing(listing);
    }
    for (const { booking, events } of getFixtureBookings()) {
      await saveBooking(booking);
      for (const event of events) {
        await appendTimelineEvent(event);
      }
    }
    await markSeeded();
  })();

  await seedingPromise;
  seedingPromise = null;
}
