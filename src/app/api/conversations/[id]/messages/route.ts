import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { detectExternalContact, contactBlockedMessage } from "@/lib/contact-detection";
import { z } from "zod";

async function loadConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return { conversation: null, allowed: false };
  const allowed = conversation.clientId === userId || conversation.professionalId === userId;
  return { conversation, allowed };
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/conversations/[id]/messages">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { conversation, allowed } = await loadConversationForUser(id, session.sub);
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ messages });
}

const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/conversations/[id]/messages">
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { conversation, allowed } = await loadConversationForUser(id, session.sub);
  if (!conversation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = sendMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error" }, { status: 400 });
  }

  const detection = detectExternalContact(parsed.data.body);
  if (detection.blocked) {
    await prisma.contactAttemptLog.create({
      data: {
        conversationId: id,
        senderId: session.sub,
        patternType: detection.patternType,
      },
    });
    return NextResponse.json(
      { error: "contact_blocked", message: contactBlockedMessage(detection.patternType) },
      { status: 422 }
    );
  }

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: session.sub, kind: "TEXT", body: parsed.data.body },
    include: { sender: { select: { id: true, name: true } } },
  });
  await prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

  return NextResponse.json({ message }, { status: 201 });
}
