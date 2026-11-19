import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email tidak boleh kosong")
    .email("Format email tidak valid"),
  password: z.string().min(6, "Minimal password 6 karakter"),
});

export const authUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["ADMIN", "CASHIER", "BARISTA"]),
});

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: authUserSchema,
});

export const authMeResponseSchema = z.object({
  user: authUserSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
