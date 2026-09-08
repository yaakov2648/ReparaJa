import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateConversation } from "@/lib/conversations";

// O profissional abre (ou cria) a conversa sobre um pedido — é sempre ele
// quem inicia o contacto antes de haver orçamento; o cliente só responde
// dentro de conversas já existentes.
export async function POST(_request: Request, ctx: RouteContext<"/api/requests/[id]/conversation">) {
  const session = await getSession();
  if (!session || session.role !== "PROFISSIONAL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: requestId } = await ctx.params;

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!serviceRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const conversation = await getOrCreateConversation(requestId, session.sub);
  return NextResponse.json({ conversation });
}
