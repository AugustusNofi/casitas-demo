"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        // Full browser navigation (not router.push) so the freshly-set cookie is guaranteed
        // to be sent on the very next request — a client-side soft nav right after setting an
        // httpOnly cookie can race with Next's middleware and leave the button stuck loading.
        window.location.href = "/admin";
        return;
      }
      const data = await res.json();
      setError(
        data.error === "not_configured"
          ? "ADMIN_PASSCODE no está configurado en el servidor."
          : "Código incorrecto."
      );
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-24">
      <p className="font-display text-2xl font-bold text-ink-900">
        casitas<span className="text-teal-600">.</span> payments
      </p>
      <p className="mt-1 text-sm text-ink-700">Acceso al back office</p>

      <form onSubmit={handleSubmit} className="mt-6 w-full">
        <input
          type="password"
          placeholder="Código de acceso"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full rounded-xl border border-sand-200 p-3 text-sm outline-none focus:border-teal-500"
        />
        {error && <p className="mt-2 text-xs font-medium text-coral-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full rounded-full bg-ink-900 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
