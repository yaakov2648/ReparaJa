"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartConversationButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/conversation`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push(`/profissional/mensagens/${data.conversation.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-3 inline-block rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold disabled:opacity-50"
    >
      {loading ? "A abrir..." : "Mensagem"}
    </button>
  );
}
