import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, ctx: RouteContext<"/api/requests/[id]">) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { client: { select: { name: true, location: true } } },
  });
  if (!serviceRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isOwner = serviceRequest.clientId === session.sub;
  if (!isOwner && session.role !== "PROFISSIONAL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // O cliente dono do pedido vê todos os orçamentos recebidos. Um
  // profissional só vê o orçamento que ele próprio enviou (nunca os da
  // concorrência) para não facilitar conluio de preços.
  const quotes = await prisma.quote.findMany({
    where: {
      requestId: id,
      ...(isOwner ? {} : { professionalId: session.sub }),
    },
    include: {
      items: { orderBy: { position: "asc" } },
      professional: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ request: serviceRequest, quotes, isOwner });
}
