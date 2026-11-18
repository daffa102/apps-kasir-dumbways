import z from "zod";

export const createCategorySchema = z.object({
    name: z
    .string() 
    .trim()
    .min(3, "Minimal 3 huruf")
    .max(50, "Maksimal 50 karakter"),
})

export type CreateCategoryInput  = z.infer<typeof createCategorySchema> 