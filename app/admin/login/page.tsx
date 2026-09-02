"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(
        data.error === "not_configured"
          ? "ADMIN_PASSCODE no está configurado en el servidor."
          : "Código incorrecto."
      );
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
