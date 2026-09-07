import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/lib/payments";
import { getOrCreateConversation, insertSystemMessage } from "@/lib/conversations";

// Simula uma recusa de pagamento, para demonstrar o caminho de falha do
// fluxo. O trabalho fica AGUARDA_PAGAMENTO — o cliente pode tentar de novo
// (Fase seguinte: permitir gerar um novo pagamento simulado sobre o mesmo
// trabalho).
export async function POST(_request: Request, ctx: RouteContext<"/api/payments/[id]/fail">) {
  const session = await getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id: paymentId } = await ctx.params;

  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { job: true } });
  if (!payment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (payment.job.clientId !== session.sub) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (payment.status !== "PENDENTE") {
    return NextResponse.json({ error: "payment_not_pending" }, { status: 409 });
  }

  const updated = await paymentService.failPayment(paymentId);

  const conversation = await getOrCreateConversation(
    payment.job.requestId,
    payment.job.professionalId
  );
  await insertSystemMessage(conversation.id, "O pagamento simulado falhou.", "PAYMENT_FAILED");

  return NextResponse.json({ payment: updated });
}
