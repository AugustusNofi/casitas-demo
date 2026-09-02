"use client";

import Link from "next/link";

export default function AdminNav() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    // Full browser navigation, not router.push — same reasoning as the login page: avoids a
    // client-side soft nav racing the cookie change against Next's middleware.
    window.location.href = "/admin/login";
  }

  return (
    <header className="border-b border-ink-900/10 bg-ink-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/admin" className="font-display text-lg font-bold text-white">
          casitas<span className="text-coral-400">.</span> payments
        </Link>
        <div className="flex items-center gap-4 text-sm text-sand-100">
          <Link href="/" className="hover:text-white">
            Ver sitio público
          </Link>
          <button onClick={logout} className="rounded-full border border-sand-100/30 px-3 py-1 hover:bg-white/10">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
