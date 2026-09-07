import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/Topbar";
import { ChatThread } from "@/components/ChatThread";

export default async function ConversaClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("CLIENTE");
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { professional: { select: { name: true } }, request: { select: { title: true } } },
  });
  if (!conversation || conversation.clientId !== user.id) notFound();

  const job = await prisma.job.findFirst({
    where: { requestId: conversation.requestId, professionalId: conversation.professionalId },
    select: { id: true },
  });

  return (
    <div className="min-h-screen bg-background">
      <Topbar name={user.name} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-3">
          <h1 className="font-bold">{conversation.professional.name}</h1>
          <p className="text-xs text-text-2">
            {job ? "Trabalho" : "Pedido"} · {conversation.request.title}
          </p>
        </div>
        <ChatThread conversationId={conversation.id} currentUserId={user.id} />
      </main>
    </div>
  );
}
