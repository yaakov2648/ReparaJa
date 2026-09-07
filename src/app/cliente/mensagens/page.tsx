import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Topbar } from "@/components/Topbar";
import { getConversationsForUser } from "@/lib/conversations";

export default async function MensagensClientePage() {
  const user = await requireUser("CLIENTE");
  const conversations = await getConversationsForUser(user.id, "CLIENTE");

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold">Mensagens</h1>

        <div className="mt-5 space-y-2">
          {conversations.length === 0 && (
            <p className="rounded-xl bg-surface p-6 text-center text-sm text-text-2 shadow-sm">
              Ainda não tens nenhuma conversa.
            </p>
          )}
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/cliente/mensagens/${c.id}`}
              className="block rounded-xl bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{c.otherParty.name}</div>
                  <div className="truncate text-xs text-text-2">
                    {c.job ? "Trabalho" : "Pedido"} · {c.request.title}
                  </div>
                  {c.lastMessage && (
                    <div className="mt-1 truncate text-sm text-text-2">{c.lastMessage.body}</div>
                  )}
                </div>
                <span className="whitespace-nowrap text-[11px] text-text-2">
                  {new Date(c.lastMessageAt).toLocaleDateString("pt-PT")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
