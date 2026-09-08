import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQuoteSchema } from "@/lib/validation/quotes";
import type { QuoteItemType } from "@/generated/prisma/enums";
import { getOrCreateConversation, insertSystemMessage } from "@/lib/conversations";
import { formatEUR } from "@/lib/format";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function POST(request: Request, ctx: RouteContext<"/api/requests/[id]/quotes">) {
  const session = await getSession();
  if (!session || session.role !== "PROFISSIONAL") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: requestId } = await ctx.params;

  const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!serviceRequest) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (serviceRequest.status !== "ABERTO") {
    return NextResponse.json({ error: "request_closed" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { notes, discountAmount, vatEnabled, vatRate, validUntilDays, items } = parsed.data;

  // Os totais nunca vêm do cliente — recalculam-se sempre no servidor a
  // partir de quantidade × preço unitário.
  const preparedItems = items.map((item, index) => {
    const lineTotal = round2(item.quantity * item.unitPrice);
    return {
      type: item.type as QuoteItemType,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      lineTotal,
      position: index,
    };
  });

  const subtotal = round2(preparedItems.reduce((sum, i) => sum + i.lineTotal, 0));
  const taxableBase = round2(Math.max(0, subtotal - discountAmount));
  const vatAmount = vatEnabled && vatRate ? round2(taxableBase * vatRate) : 0;
  const total = round2(taxableBase + vatAmount);
  const validUntil = validUntilDays
    ? new Date(Date.now() + validUntilDays * 24 * 60 * 60 * 1000)
    : null;

  const quote = await prisma.quote.create({
    data: {
      requestId,
      professionalId: session.sub,
      notes: notes || null,
      discountAmount,
      vatEnabled,
      vatRate: vatEnabled ? vatRate : null,
      subtotal,
      taxableBase,
      vatAmount,
      total,
      validUntil,
      items: { create: preparedItems },
    },
    include: { items: { orderBy: { position: "asc" } } },
  });

  const conversation = await getOrCreateConversation(requestId, session.sub);
  await insertSystemMessage(
    conversation.id,
    `Novo orçamento enviado: ${formatEUR(total)}`,
    "QUOTE_SENT",
    { quoteId: quote.id, total }
  );

  return NextResponse.json({ quote }, { status: 201 });
}
