import { prisma } from "@/lib/prisma";
import type { InputJsonValue } from "@prisma/client/runtime/client";
import type { UserRole } from "@/generated/prisma/enums";

export async function getConversationsForUser(userId: string, role: UserRole) {
  const where = role === "CLIENTE" ? { clientId: userId } : { professionalId: userId };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    include: {
      request: { select: { id: true, title: true, category: true } },
      client: { select: { id: true, name: true } },
      professional: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const jobs =
    conversations.length === 0
      ? []
      : await prisma.job.findMany({
          where: {
            OR: conversations.map((c) => ({
              requestId: c.requestId,
              professionalId: c.professionalId,
            })),
          },
          select: { id: true, status: true, requestId: true, professionalId: true },
        });
  const jobByPair = new Map(jobs.map((j) => [`${j.requestId}:${j.professionalId}`, j]));

  return conversations.map((c) => ({
    id: c.id,
    request: c.request,
    otherParty: role === "CLIENTE" ? c.professional : c.client,
    lastMessage: c.messages[0] ?? null,
    lastMessageAt: c.lastMessageAt,
    job: jobByPair.get(`${c.requestId}:${c.professionalId}`) ?? null,
  }));
}

export async function getOrCreateConversation(requestId: string, professionalId: string) {
  const existing = await prisma.conversation.findUnique({
    where: { requestId_professionalId: { requestId, professionalId } },
  });
  if (existing) return existing;

  const request = await prisma.serviceRequest.findUniqueOrThrow({ where: { id: requestId } });
  return prisma.conversation.create({
    data: { requestId, professionalId, clientId: request.clientId },
  });
}

// Insere um evento automático no histórico da conversa. Nunca deve incluir
// valores de comissão — a conversa é partilhada pelas duas partes e o
// cliente não pode saber a comissão (ver src/lib/serialize.ts).
export async function insertSystemMessage(
  conversationId: string,
  body: string,
  systemType: string,
  systemPayload?: Record<string, unknown>
) {
  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        kind: "SYSTEM",
        body,
        systemType,
        systemPayload: systemPayload as InputJsonValue | undefined,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);
}
