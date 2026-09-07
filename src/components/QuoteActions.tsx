"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "accept" | "reject") {
    setError(null);
    setLoading(action);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error === "quote_not_available"
            ? "Este orçamento já não está disponível."
            : "Não foi possível concluir a ação."
        );
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => act("accept")}
          disabled={loading !== null}
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading === "accept" ? "A aceitar..." : "Aceitar orçamento"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading !== null}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading === "reject" ? "A recusar..." : "Recusar"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
    </div>
  );
}
