"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_CATEGORIES, REQUEST_TIMINGS, type ServiceCategoryValue } from "@/lib/constants";

export function NovoPedidoForm() {
  const router = useRouter();
  const [category, setCategory] = useState<ServiceCategoryValue>("REMODELACAO");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [timing, setTiming] = useState<string>("PROXIMAS_DUAS_SEMANAS");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          timing,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details?.fieldErrors?.title?.[0] ?? "Não foi possível publicar o pedido.");
        return;
      }
      router.push("/cliente/pedidos");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-xl font-bold">Pedir orçamento</h1>
      <p className="text-sm text-text-2">
        Descreve o que precisas. Em segundos podes começar a receber propostas.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-text-2">Tipo de serviço</label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                  category === c.value
                    ? "border-orange bg-orange text-white"
                    : "border-border bg-surface"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-2">
            Título do trabalho
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Pintar sala de 25m² e quarto"
            className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-orange"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-2">
            Descrição detalhada
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreve o estado atual, o que queres mudar, prazos..."
            className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-orange"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            <label className="mb-1 block text-sm font-semibold text-text-2">
              Quando precisas?
            </label>
            <select
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            >
              {REQUEST_TIMINGS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-2">
              Orçamento mínimo (€)
            </label>
            <input
              inputMode="decimal"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-2">
              Orçamento máximo (€)
            </label>
            <input
              inputMode="decimal"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-orange py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "A publicar..." : "Publicar pedido →"}
        </button>
      </form>
    </main>
  );
}
