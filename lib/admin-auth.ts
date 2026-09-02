// Deliberately avoids Node's `crypto` module: this file is imported by middleware.ts,
// which runs on the Edge runtime. The cookie just needs to prove the caller knows the
// server-side passcode — using the passcode itself (httpOnly, secure cookie) is enough
// for a demo-scale admin gate.

const COOKIE_NAME = "casitas_admin";

export function adminCookieName() {
  return COOKIE_NAME;
}

export function checkPasscode(passcode: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  return !!expected && passcode === expected;
}

export function adminSessionValue(): string | null {
  return process.env.ADMIN_PASSCODE || null;
}

export function isValidAdminCookie(value: string | undefined): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  return !!expected && !!value && value === expected;
}
