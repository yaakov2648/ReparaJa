import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/lib/payments";
import { getOrCreateConversation, insertSystemMessage } from "@/lib/conversations";

// Simula a aprovação do pagamento (no mundo real seria um webhook do
// processador). Só o cliente dono do trabalho pode acionar esta simulação.
export async function POST(_request: Request, ctx: RouteContext<"/api/payments/[id]/confirm">) {
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

  const updated = await paymentService.confirmPayment(paymentId);

  const conversation = await getOrCreateConversation(
    payment.job.requestId,
    payment.job.professionalId
  );
  await insertSystemMessage(
    conversation.id,
    "Pagamento confirmado (simulado). O trabalho está agora em curso.",
    "PAYMENT_CONFIRMED"
  );

  return NextResponse.json({ payment: updated });
}
