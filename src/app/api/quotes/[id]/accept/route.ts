import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission, getActiveCommissionTiers } from "@/lib/commission";
import { paymentService } from "@/lib/payments";
import { toClientSafeJob } from "@/lib/serialize";
import { getOrCreateConversation, insertSystemMessage } from "@/lib/conversations";
import { formatEUR } from "@/lib/format";
import { acceptQuoteSchema } from "@/lib/validation/billing";

export async function POST(request: Request, ctx: RouteContext<"/api/quotes/[id]/accept">) {
  const session = await getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: quoteId } = await ctx.params;

  const rawBody = await request.json().catch(() => ({}));
  const parsedBilling = acceptQuoteSchema.safeParse(rawBody ?? {});
  if (!parsedBilling.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsedBilling.error.flatten() },
      { status: 400 }
    );
  }
  const billing = parsedBilling.data;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { request: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (quote.request.clientId !== session.sub) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (quote.status !== "ENVIADO" || quote.request.status !== "ABERTO") {
    return NextResponse.json({ error: "quote_not_available" }, { status: 409 });
  }

  const tiers = await getActiveCommissionTiers();
  // A comissão incide sobre o valor líquido do trabalho (subtotal - desconto),
  // antes de IVA — nunca sobre o total pago pelo cliente.
  const commission = calculateCommission(Number(quote.taxableBase), tiers);

  const otherQuotes = await prisma.quote.findMany({
    where: { requestId: quote.requestId, id: { not: quote.id }, status: "ENVIADO" },
    select: { professionalId: true },
  });

  const job = await prisma.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quote.id }, data: { status: "ACEITE" } });
    await tx.quote.updateMany({
      where: { requestId: quote.requestId, id: { not: quote.id }, status: "ENVIADO" },
      data: { status: "RECUSADO" },
    });
    await tx.serviceRequest.update({ where: { id: quote.requestId }, data: { status: "FECHADO" } });
    return tx.job.create({
      data: {
        requestId: quote.requestId,
        quoteId: quote.id,
        clientId: quote.request.clientId,
        professionalId: quote.professionalId,
        agreedTotal: quote.total,
        commissionApplicableAmount: commission.applicableAmount,
        commissionAmount: commission.totalCommission,
        commissionBreakdown: commission.breakdown,
        wantsInvoice: billing.wantsInvoice,
        billingName: billing.wantsInvoice ? billing.billingName : null,
        billingNif: billing.wantsInvoice ? billing.billingNif : null,
        billingAddress: billing.wantsInvoice ? billing.billingAddress : null,
        billingPostalCode: billing.wantsInvoice ? billing.billingPostalCode : null,
        billingCity: billing.wantsInvoice ? billing.billingCity : null,
      },
    });
  });

  // Guarda como sugestão para a próxima vez — o que fica válido para este
  // trabalho é sempre o snapshot gravado no Job acima, nunca isto.
  if (billing.wantsInvoice) {
    await prisma.user.update({
      where: { id: session.sub },
      data: {
        billingName: billing.billingName,
        billingNif: billing.billingNif,
        billingAddress: billing.billingAddress,
        billingPostalCode: billing.billingPostalCode,
        billingCity: billing.billingCity,
      },
    });
  }

  // Cria já o "pagamento" (simulado) associado ao trabalho, para o cliente
  // poder avançar no ecrã — nada aqui move dinheiro real.
  const payment = await paymentService.createPayment({
    jobId: job.id,
    amount: Number(job.agreedTotal),
  });

  const wonConversation = await getOrCreateConversation(quote.requestId, quote.professionalId);
  await insertSystemMessage(
    wonConversation.id,
    `Orçamento aceite: ${formatEUR(quote.total.toString())}`,
    "QUOTE_ACCEPTED",
    { quoteId: quote.id }
  );
  for (const other of otherQuotes) {
    const conv = await getOrCreateConversation(quote.requestId, other.professionalId);
    await insertSystemMessage(
      conv.id,
      "O cliente optou por outro profissional para este pedido.",
      "QUOTE_AUTO_REJECTED"
    );
  }

  // Esta rota só é chamada pelo cliente — a comissão nunca vai no corpo
  // da resposta, mesmo que a UI atual não a mostre (a aba de rede do
  // browser mostraria o JSON na mesma).
  return NextResponse.json({ job: toClientSafeJob(job), payment });
}
