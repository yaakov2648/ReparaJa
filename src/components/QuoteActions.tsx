"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DefaultBilling = {
  billingName: string | null;
  billingNif: string | null;
  billingAddress: string | null;
  billingPostalCode: string | null;
  billingCity: string | null;
};

export function QuoteActions({
  quoteId,
  defaultBilling,
}: {
  quoteId: string;
  defaultBilling?: DefaultBilling;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "invoice">("idle");
  const [wantsInvoice, setWantsInvoice] = useState(Boolean(defaultBilling?.billingNif));
  const [billingName, setBillingName] = useState(defaultBilling?.billingName ?? "");
  const [billingNif, setBillingNif] = useState(defaultBilling?.billingNif ?? "");
  const [billingAddress, setBillingAddress] = useState(defaultBilling?.billingAddress ?? "");
  const [billingPostalCode, setBillingPostalCode] = useState(
    defaultBilling?.billingPostalCode ?? ""
  );
  const [billingCity, setBillingCity] = useState(defaultBilling?.billingCity ?? "");

  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reject() {
    setError(null);
    setLoading("reject");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/reject`, { method: "POST" });
      if (!res.ok) {
        setError("Não foi possível recusar o orçamento.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function confirmAccept() {
    setError(null);
    setLoading("accept");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          wantsInvoice
            ? { wantsInvoice, billingName, billingNif, billingAddress, billingPostalCode, billingCity }
            : { wantsInvoice: false }
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          data?.error === "quote_not_available"
            ? "Este orçamento já não está disponível."
            : data?.details?.fieldErrors?.billingNif?.[0] ??
                "Verifica os dados de faturação e tenta novamente."
        );
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (step === "idle") {
    return (
      <div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep("invoice")}
            className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white"
          >
            Aceitar orçamento
          </button>
          <button
            onClick={reject}
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

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={wantsInvoice}
          onChange={(e) => setWantsInvoice(e.target.checked)}
        />
        Quero fatura com os meus dados fiscais
      </label>

      {wantsInvoice && (
        <div className="mt-3 space-y-2">
          <input
            value={billingName}
            onChange={(e) => setBillingName(e.target.value)}
            placeholder="Nome ou firma para a fatura"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
          />
          <input
            value={billingNif}
            onChange={(e) => setBillingNif(e.target.value)}
            placeholder="NIF"
            inputMode="numeric"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
          />
          <input
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="Morada fiscal"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
          />
          <div className="flex gap-2">
            <input
              value={billingPostalCode}
              onChange={(e) => setBillingPostalCode(e.target.value)}
              placeholder="0000-000"
              className="w-28 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
            />
            <input
              value={billingCity}
              onChange={(e) => setBillingCity(e.target.value)}
              placeholder="Localidade"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
            />
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={confirmAccept}
          disabled={loading !== null}
          className="rounded-lg bg-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading === "accept" ? "A confirmar..." : "Confirmar aceitação"}
        </button>
        <button
          onClick={() => setStep("idle")}
          disabled={loading !== null}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
