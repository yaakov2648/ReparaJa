import { prisma } from "@/lib/prisma";
import type { PaymentService } from "./PaymentService";

function mockReference(prefix: string): string {
  return `mock_${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

// Processador 100% simulado. Não contacta nenhum serviço externo e não move
// dinheiro real — serve para demonstrar e testar o fluxo de contratação
// (pagamento -> execução -> conclusão -> payout) antes de existir uma
// integração real. Todos os registos que cria ficam marcados provider:"mock"
// na base de dados, para nunca serem confundidos com pagamentos reais.
export class MockPaymentService implements PaymentService {
  async createPayment(input: { jobId: string; amount: number }) {
    return prisma.payment.create({
      data: {
        jobId: input.jobId,
        amount: input.amount,
        provider: "mock",
        providerReference: mockReference("pay"),
        status: "PENDENTE",
      },
    });
  }

  async confirmPayment(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status !== "PENDENTE") {
      throw new Error("payment_not_pending");
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status: "CONFIRMADO", confirmedAt: new Date() },
      });
      await tx.job.update({ where: { id: payment.jobId }, data: { status: "EM_CURSO" } });
      return updated;
    });
  }

  async failPayment(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status !== "PENDENTE") {
      throw new Error("payment_not_pending");
    }
    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: "FALHADO", failedAt: new Date() },
    });
  }

  async createPayout(input: { jobId: string; professionalId: string; amount: number }) {
    return prisma.payout.create({
      data: {
        jobId: input.jobId,
        professionalId: input.professionalId,
        amount: input.amount,
        provider: "mock",
        providerReference: mockReference("payout"),
        status: "PENDENTE",
      },
    });
  }

  async releasePayout(payoutId: string) {
    const payout = await prisma.payout.findUniqueOrThrow({ where: { id: payoutId } });
    if (payout.status !== "PENDENTE") {
      throw new Error("payout_not_pending");
    }
    return prisma.payout.update({
      where: { id: payoutId },
      data: { status: "LIBERTADO", releasedAt: new Date() },
    });
  }
}
