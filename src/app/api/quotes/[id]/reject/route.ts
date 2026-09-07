import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, ctx: RouteContext<"/api/quotes/[id]/reject">) {
  const session = await getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: quoteId } = await ctx.params;

  const quote = await prisma.quote.findUnique({ where: { id: quoteId }, include: { request: true } });
  if (!quote) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (quote.request.clientId !== session.sub) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (quote.status !== "ENVIADO") {
    return NextResponse.json({ error: "quote_not_available" }, { status: 409 });
  }

  const updated = await prisma.quote.update({ where: { id: quote.id }, data: { status: "RECUSADO" } });
  return NextResponse.json({ quote: updated });
}
