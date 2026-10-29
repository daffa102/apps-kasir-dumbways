import { z } from "zod";


export const loginSchema = z.object({
    email: z
    .string({ required_error: "Email wajib diisi"})
    .min(1, "Email tidak boleh kosong")
    .trim()
    .email("Format email tidak valid"),

    password:z
    .string({ required_error: "Password wajib diisi"})
    .min(6, "Minimal password 6 karakter"),
});

export const registerSchema = z.object({
    name: z
    .string({ required_error: "Nama tidak boleh kosong" })
    .trim(),

    email: z
    .string({ required_error: "Email wajib diisi"})
    .trim()
    .min(1, "Email tidak boleh kosong")
    .email("Format email tidak valid"),

    password: ***
    .string({ required_error: "Password wajib diisi"})
    .min(6, "Password minimal 6 karakter")
    .regex(/[A-Z]/)
    .regex(/[0-9]/)

    role: z.enum(["ADMIN", "CASHIER", "BARISTA"],
        { errorMap: () => ({message: "Role harus Admin, Kasir, atau Barista"}),
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

