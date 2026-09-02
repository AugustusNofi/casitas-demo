import { NextResponse } from "next/server";
import { checkPasscode, adminCookieName, adminSessionValue } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const { passcode } = (await req.json()) as { passcode: string };

  if (!process.env.ADMIN_PASSCODE) {
    return NextResponse.json(
      { error: "not_configured", message: "ADMIN_PASSCODE no está configurado en el servidor." },
      { status: 503 }
    );
  }

  if (!checkPasscode(passcode)) {
    return NextResponse.json({ error: "invalid_passcode" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(adminCookieName(), adminSessionValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
