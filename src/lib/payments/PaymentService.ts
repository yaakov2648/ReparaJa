import type { PaymentModel as Payment, PayoutModel as Payout } from "@/generated/prisma/models";

// Contrato que qualquer processador de pagamentos tem de cumprir. Hoje só
// existe MockPaymentService (src/lib/payments/mock-provider.ts) — tudo
// simulado, sem nenhuma chamada externa nem dinheiro real envolvido.
//
// Quando a integração real (Stripe Connect) for implementada, cria-se um
// StripePaymentService que cumpra esta mesma interface e troca-se a
// instância exportada em src/lib/payments/index.ts. O resto da aplicação
// (rotas de API, páginas) fala sempre com esta interface, nunca diretamente
// com o Stripe — para não ter de ser reescrito nessa altura.
//
// Nota sobre confirmPayment/failPayment: aqui são chamadas explícitas
// disparadas por um botão no ecrã, a simular o que no mundo real seria um
// webhook assíncrono do processador a confirmar ou recusar o pagamento.
export interface PaymentService {
  createPayment(input: { jobId: string; amount: number }): Promise<Payment>;
  confirmPayment(paymentId: string): Promise<Payment>;
  failPayment(paymentId: string): Promise<Payment>;

  createPayout(input: {
    jobId: string;
    professionalId: string;
    amount: number;
  }): Promise<Payout>;
  releasePayout(payoutId: string): Promise<Payout>;
}
