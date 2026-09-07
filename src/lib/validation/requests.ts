import { z } from "zod";
import { SERVICE_CATEGORIES, REQUEST_TIMINGS } from "@/lib/constants";

const categoryValues = SERVICE_CATEGORIES.map((c) => c.value) as [string, ...string[]];
const timingValues = REQUEST_TIMINGS.map((t) => t.value) as [string, ...string[]];

export const createRequestSchema = z.object({
  title: z.string().trim().min(4, "Indica um título para o trabalho."),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.enum(categoryValues),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  timing: z.enum(timingValues).default("SEM_URGENCIA"),
});
