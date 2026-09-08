import { z } from "zod";
import { isValidPortugueseNif } from "@/lib/nif";

export const acceptQuoteSchema = z
  .object({
    wantsInvoice: z.boolean().default(false),
    billingName: z.string().trim().min(2).max(200).optional(),
    billingNif: z
      .string()
      .trim()
      .refine((v) => isValidPortugueseNif(v), "NIF inválido.")
      .optional(),
    billingAddress: z.string().trim().min(3).max(300).optional(),
    billingPostalCode: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{3}$/, "Código postal no formato 0000-000.")
      .optional(),
    billingCity: z.string().trim().min(2).max(120).optional(),
  })
  .refine(
    (data) =>
      !data.wantsInvoice ||
      (data.billingName &&
        data.billingNif &&
        data.billingAddress &&
        data.billingPostalCode &&
        data.billingCity),
    { message: "Preenche todos os dados de faturação.", path: ["billingNif"] }
  );

export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;
