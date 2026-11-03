import { z } from "zod";


export const loginSchema = z.object({
    email: z
    .string()
    .min(1, "Email tidak boleh kosong")
    .trim()
    .email("Format email tidak valid"),

    password:z
    .string()
    .min(6, "Minimal password 6 karakter"),
});

export const registerSchema = z.object({
    name: z
    .string()
    .trim(),

    email: z
    .string()
    .trim()
    .min(1, "Email tidak boleh kosong")
    .email("Format email tidak valid"),

    password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .regex(/[A-Z]/)
    .regex(/[0-9]/),

    role: z.enum(["ADMIN", "CASHIER", "BARISTA"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

