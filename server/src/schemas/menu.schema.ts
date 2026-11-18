import z from "zod";

export const createMenuSchema = z.object({
    name: z.string().trim().min(3, "Minimal 3 karakter").max(50, "Maksimal 50 karakter"),
    description: z.string().max(255, "Maksimal 255 karakter").optional(),
    price: z.coerce.number().min(0, "Harga tidak boleh minus"),
    categoryId: z.string().min(1, "Wajib diisi"),

})

export const updateMenuSchema = createMenuSchema.partial().extend({
    isAvailable: z.preprocess((val) => {
        if(val === "true" || val === true) return true;
        if(val === "false" || val === false) return false;
        return val;
    }, z.boolean()).optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>  
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>