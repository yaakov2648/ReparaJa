import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Indica o teu nome completo."),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  password: z.string().min(8, "A password tem de ter pelo menos 8 caracteres."),
  role: z.enum(["CLIENTE", "PROFISSIONAL"]),
  phone: z.string().trim().min(6).optional().or(z.literal("")),
  location: z.string().trim().min(2).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido."),
  password: z.string().min(1, "Indica a password."),
});
