// Uses the Web Crypto API (available globally in both the browser and Node 19+) rather than
// Node's `crypto` module, since this now needs to work inside client components too.
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
