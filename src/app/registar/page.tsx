"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "CLIENTE" | "PROFISSIONAL";

export default function RegistarPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("CLIENTE");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, location }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "email_in_use"
            ? "Já existe uma conta com este email."
            : "Não foi possível criar a conta. Verifica os dados."
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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-bold text-navy">
          Criar conta na Repara<span className="text-orange">Já</span>
        </h1>

        <div className="mt-6 flex rounded-lg bg-background p-1">
          <button
            type="button"
            onClick={() => setRole("CLIENTE")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              role === "CLIENTE" ? "bg-orange text-white" : "text-text-2"
            }`}
          >
            Sou cliente
          </button>
          <button
            type="button"
            onClick={() => setRole("PROFISSIONAL")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              role === "PROFISSIONAL" ? "bg-orange text-white" : "text-text-2"
            }`}
          >
            Sou profissional
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-2">Nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-orange"
            />
          </div>
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
            <label className="mb-1 block text-sm font-semibold text-text-2">Localização</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Lamego, Viseu"
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-orange"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-2">Password</label>
            <input
              type="password"
              required
              minLength={8}
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
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-text-2">
          Já tens conta?{" "}
          <Link href="/entrar" className="font-semibold text-orange">
            Entra
          </Link>
        </p>
      </div>
    </main>
  );
}
