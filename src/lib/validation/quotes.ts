import { z } from "zod";
import { QUOTE_ITEM_TYPES } from "@/lib/constants";

const itemTypeValues = QUOTE_ITEM_TYPES.map((t) => t.value) as [string, ...string[]];

export const quoteItemSchema = z.object({
  type: z.enum(itemTypeValues),
  description: z.string().trim().min(1, "Descreve a linha.").max(200),
  quantity: z.number().positive("Quantidade tem de ser maior que zero."),
  unit: z.string().trim().min(1).max(20),
  unitPrice: z.number().nonnegative("Preço não pode ser negativo."),
});

export const createQuoteSchema = z
  .object({
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    discountAmount: z.number().nonnegative().default(0),
    vatEnabled: z.boolean().default(false),
    vatRate: z.number().min(0).max(1).optional(),
    validUntilDays: z.number().int().positive().max(90).optional(),
    items: z.array(quoteItemSchema).min(1, "Adiciona pelo menos uma linha ao orçamento."),
  })
  .refine((data) => !data.vatEnabled || typeof data.vatRate === "number", {
    message: "Indica a taxa de IVA.",
    path: ["vatRate"],
  });
