"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QUOTE_ITEM_TYPES, type QuoteItemTypeValue } from "@/lib/constants";
import { formatEUR } from "@/lib/format";

type Item = {
  key: number;
  type: QuoteItemTypeValue;
  description: string;
  quantity: string; // string enquanto se edita, para não lutar contra o input
  unit: string;
  unitPrice: string;
};

let nextKey = 1;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const VALIDITY_OPTIONS = [
  { label: "3 dias", value: 3 },
  { label: "7 dias", value: 7 },
  { label: "14 dias", value: 14 },
];

export function QuoteBuilder({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [discountAmount, setDiscountAmount] = useState("0");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [vatRate, setVatRate] = useState("0.23");
  const [validUntilDays, setValidUntilDays] = useState<number>(7);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastPriceInputRef = useRef<HTMLInputElement | null>(null);

  function addItem(type: (typeof QUOTE_ITEM_TYPES)[number]) {
    setItems((prev) => [
      ...prev,
      {
        key: nextKey++,
        type: type.value,
        description: type.label,
        quantity: "1",
        unit: type.unit,
        unitPrice: "",
      },
    ]);
    // dá foco ao preço da linha que acabou de aparecer, para o profissional
    // só ter de escrever o valor e seguir para a próxima linha
    requestAnimationFrame(() => lastPriceInputRef.current?.focus());
  }

  function updateItem(key: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key: number) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const totals = useMemo(() => {
    const subtotal = round2(
      items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
    );
    const discount = Number(discountAmount) || 0;
    const taxableBase = round2(Math.max(0, subtotal - discount));
    const rate = vatEnabled ? Number(vatRate) || 0 : 0;
    const vatAmount = round2(taxableBase * rate);
    const total = round2(taxableBase + vatAmount);
    return { subtotal, taxableBase, vatAmount, total };
  }, [items, discountAmount, vatEnabled, vatRate]);

  async function handleSubmit() {
    setError(null);
    if (items.length === 0) {
      setError("Adiciona pelo menos uma linha ao orçamento.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || undefined,
          discountAmount: Number(discountAmount) || 0,
          vatEnabled,
          vatRate: vatEnabled ? Number(vatRate) : undefined,
          validUntilDays,
          items: items.map((i) => ({
            type: i.type,
            description: i.description,
            quantity: Number(i.quantity) || 0,
            unit: i.unit,
            unitPrice: Number(i.unitPrice) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.details?.formErrors?.[0] ?? "Não foi possível enviar o orçamento.");
        return;
      }
      router.push("/profissional/orcamentos");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-32">
      <div className="mb-4">
        <h2 className="font-semibold">Linhas do orçamento</h2>
        <p className="text-sm text-text-2">Toca numa categoria para acrescentar uma linha.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUOTE_ITEM_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => addItem(type)}
            className="rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium active:scale-95"
          >
            + {type.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 && (
          <p className="rounded-xl bg-surface p-4 text-center text-sm text-text-2 shadow-sm">
            Ainda sem linhas. Começa por tocar em &quot;Mão de obra&quot; acima.
          </p>
        )}
        {items.map((item, idx) => {
          const lineTotal = round2((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
          const isLast = idx === items.length - 1;
          return (
            <div key={item.key} className="rounded-xl bg-surface p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <input
                  value={item.description}
                  onChange={(e) => updateItem(item.key, { description: e.target.value })}
                  className="flex-1 border-b border-transparent bg-transparent text-sm font-semibold outline-none focus:border-orange"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label="Remover linha"
                  className="text-text-2"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <input
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                  className="w-14 min-w-0 rounded-lg border border-border px-2 py-1.5 text-center"
                  aria-label="Quantidade"
                />
                <span className="text-text-2">×</span>
                <input
                  value={item.unit}
                  onChange={(e) => updateItem(item.key, { unit: e.target.value })}
                  className="w-14 min-w-0 rounded-lg border border-border px-2 py-1.5 text-center"
                  aria-label="Unidade"
                />
                <div className="flex min-w-0 items-center gap-1">
                  <span className="text-text-2">€</span>
                  <input
                    ref={isLast ? lastPriceInputRef : undefined}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.key, { unitPrice: e.target.value })}
                    className="w-20 min-w-0 rounded-lg border border-border px-2 py-1.5 text-center"
                    aria-label="Preço unitário"
                  />
                </div>
                <span className="ml-auto whitespace-nowrap font-semibold">
                  {formatEUR(lineTotal)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-4 rounded-xl bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-text-2">Desconto (€)</label>
          <input
            inputMode="decimal"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(e.target.value)}
            className="w-28 rounded-lg border border-border px-2 py-1.5 text-right"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-text-2">
            <input
              type="checkbox"
              checked={vatEnabled}
              onChange={(e) => setVatEnabled(e.target.checked)}
            />
            Cobrar IVA
          </label>
          {vatEnabled && (
            <select
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              className="rounded-lg border border-border px-2 py-1.5"
            >
              <option value="0.23">23%</option>
              <option value="0.13">13%</option>
              <option value="0.06">6%</option>
            </select>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-text-2">Validade da proposta</label>
          <select
            value={validUntilDays}
            onChange={(e) => setValidUntilDays(Number(e.target.value))}
            className="rounded-lg border border-border px-2 py-1.5"
          >
            {VALIDITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-text-2">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: inclui garantia de 2 anos na mão de obra"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-orange"
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface p-4 shadow-[0_-4px_16px_rgba(14,30,58,0.08)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          <div>
            <div className="text-xs text-text-2">
              Subtotal {formatEUR(totals.subtotal)}
              {Number(discountAmount) > 0 && ` · Desconto ${formatEUR(Number(discountAmount))}`}
              {vatEnabled && ` · IVA ${formatEUR(totals.vatAmount)}`}
            </div>
            <div className="text-xl font-bold text-navy">{formatEUR(totals.total)}</div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            className="rounded-lg bg-orange px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "A enviar..." : "Enviar orçamento →"}
          </button>
        </div>
        {error && <p className="mx-auto mt-2 max-w-2xl text-sm text-red">{error}</p>}
      </div>
    </div>
  );
}
