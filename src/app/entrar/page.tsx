"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "invalid_credentials"
            ? "Email ou password incorretos."
            : "Não foi possível entrar. Tenta novamente."
        );
        return;
      }
      router.push(data.user.role === "CLIENTE" ? "/cliente" : "/profissional");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-bold text-navy">
          Entrar na Repara<span className="text-orange">Já</span>
        </h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-orange"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-orange"
            />
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange py-2 font-semibold text-white transition hover:brightness-105 disabled:opacity-50"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-text-2">
          Ainda não tens conta?{" "}
          <Link href="/registar" className="font-semibold text-orange">
            Regista-te
          </Link>
        </p>
      </div>
    </main>
  );
}
