import { MockPaymentService } from "./mock-provider";
import type { PaymentService } from "./PaymentService";

// Único ponto de escolha do processador de pagamentos. Hoje é sempre o
// simulado — não existe nenhuma integração real (ver aviso em
// PaymentService.ts e mock-provider.ts).
export const paymentService: PaymentService = new MockPaymentService();

export type { PaymentService } from "./PaymentService";
