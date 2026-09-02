import { NextRequest, NextResponse } from "next/server";
import { adminCookieName, isValidAdminCookie } from "@/lib/admin-auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get(adminCookieName())?.value;
  const authed = isValidAdminCookie(cookie);

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/api/admin") &&
    pathname !== "/api/admin/login" &&
    !authed
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
