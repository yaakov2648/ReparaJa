"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function useAction() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(key: string, url: string) {
    setError(null);
    setLoading(key);
    try {
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        setError("Não foi possível concluir a ação. Tenta novamente.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return { run, loading, error };
}

export function PaymentSimulationActions({ paymentId }: { paymentId: string }) {
  const { run, loading, error } = useAction();
  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => run("confirm", `/api/payments/${paymentId}/confirm`)}
          disabled={loading !== null}
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading === "confirm" ? "A simular..." : "Simular pagamento aprovado"}
        </button>
        <button
          onClick={() => run("fail", `/api/payments/${paymentId}/fail`)}
          disabled={loading !== null}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading === "fail" ? "A simular..." : "Simular falha"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
    </div>
  );
}

export function CompleteJobAction({ jobId }: { jobId: string }) {
  const { run, loading, error } = useAction();
  return (
    <div>
      <button
        onClick={() => run("complete", `/api/jobs/${jobId}/complete`)}
        disabled={loading !== null}
        className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading === "complete" ? "A confirmar..." : "Marcar trabalho como concluído"}
      </button>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
    </div>
  );
}
