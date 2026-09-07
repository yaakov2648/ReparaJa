"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  kind: "TEXT" | "SYSTEM";
  body: string | null;
  createdAt: string;
  sender: { id: string; name: string } | null;
};

const POLL_MS = 4000;

export function ChatThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setMessages(data.messages);
    }

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Não foi possível enviar a mensagem.");
        return;
      }
      setInput("");
      setMessages((prev) => [...prev, data.message]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl bg-surface shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) =>
          m.kind === "SYSTEM" ? (
            <div key={m.id} className="my-2 text-center text-xs text-text-2">
              {m.body}
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex ${m.sender?.id === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender?.id === currentUserId
                    ? "bg-orange text-white"
                    : "bg-background text-foreground"
                }`}
              >
                {m.body}
              </div>
            </div>
          )
        )}
        {messages.length === 0 && (
          <p className="mt-6 text-center text-sm text-text-2">
            Ainda não há mensagens nesta conversa.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-3">
        {error && <p className="mb-2 text-xs text-red">{error}</p>}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreve uma mensagem..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-orange"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-full bg-orange px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-2">
          Combina tudo por aqui — números de telefone, emails e links externos são bloqueados
          automaticamente.
        </p>
      </form>
    </div>
  );
}
