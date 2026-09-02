import { Redis } from "@upstash/redis";
import type { Booking, Listing, TimelineEvent } from "./types";

// Vercel-managed Upstash Redis is the persistence layer. When it isn't provisioned yet
// (e.g. running locally before `vercel env pull`), everything falls back to an in-memory
// store scoped to the running process, so local dev and the seed script still work.

let redisClient: Redis | null | undefined;

function client(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

export function kvConfigured() {
  return client() !== null;
}

const mem = new Map<string, unknown>();
const memSets = new Map<string, Set<string>>();

async function kvGet<T>(key: string): Promise<T | null> {
  const r = client();
  if (r) return (await r.get<T>(key)) ?? null;
  return (mem.get(key) as T) ?? null;
}

async function kvSet<T>(key: string, value: T): Promise<void> {
  const r = client();
  if (r) {
    await r.set(key, value as unknown as string);
    return;
  }
  mem.set(key, value);
}

async function kvSadd(key: string, member: string): Promise<void> {
  const r = client();
  if (r) {
    await r.sadd(key, member);
    return;
  }
  if (!memSets.has(key)) memSets.set(key, new Set());
  memSets.get(key)!.add(member);
}

async function kvSmembers(key: string): Promise<string[]> {
  const r = client();
  if (r) return (await r.smembers(key)) as string[];
  return Array.from(memSets.get(key) ?? []);
}

// --- Listings ---

export async function saveListing(listing: Listing) {
  await kvSet(`listing:${listing.id}`, listing);
  await kvSadd("listings:all", listing.id);
}

export async function getListing(id: string): Promise<Listing | null> {
  return kvGet<Listing>(`listing:${id}`);
}

export async function getAllListings(): Promise<Listing[]> {
  const ids = await kvSmembers("listings:all");
  const listings = await Promise.all(ids.map((id) => getListing(id)));
  return listings.filter((l): l is Listing => l !== null);
}

// --- Bookings ---

export async function saveBooking(booking: Booking) {
  await kvSet(`booking:${booking.id}`, booking);
  await kvSadd("bookings:all", booking.id);
}

export async function getBooking(id: string): Promise<Booking | null> {
  return kvGet<Booking>(`booking:${id}`);
}

export async function getAllBookings(): Promise<Booking[]> {
  const ids = await kvSmembers("bookings:all");
  const bookings = await Promise.all(ids.map((id) => getBooking(id)));
  return bookings
    .filter((b): b is Booking => b !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- Timeline events (per booking) ---

export async function appendTimelineEvent(event: TimelineEvent) {
  const key = `booking:${event.bookingId}:events`;
  const existing = (await kvGet<TimelineEvent[]>(key)) || [];
  existing.push(event);
  await kvSet(key, existing);
}

export async function getTimeline(bookingId: string): Promise<TimelineEvent[]> {
  const events = (await kvGet<TimelineEvent[]>(`booking:${bookingId}:events`)) || [];
  return events.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// --- Raw Nuvei transaction/DMN log (debug + audit trail) ---

export async function logTransaction(bookingId: string, kind: string, payload: unknown) {
  const key = `booking:${bookingId}:txns`;
  const existing = (await kvGet<Array<{ kind: string; payload: unknown; at: string }>>(key)) || [];
  existing.push({ kind, payload, at: new Date().toISOString() });
  await kvSet(key, existing);
}

export async function getTransactionLog(bookingId: string) {
  return (await kvGet<Array<{ kind: string; payload: unknown; at: string }>>(`booking:${bookingId}:txns`)) || [];
}

// --- Seed guard ---

export async function isSeeded(): Promise<boolean> {
  return (await kvGet<boolean>("seeded")) === true;
}

export async function markSeeded(): Promise<void> {
  await kvSet("seeded", true);
}
