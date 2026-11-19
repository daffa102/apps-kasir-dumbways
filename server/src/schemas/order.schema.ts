import {z} from "zod";

export const orderItemSchema = z.object({
    menuId: z.string().uuid(),

    quantity: z.number().int().min(1, "Jumlah tidak boleh nol"),

    note: z.string().max(255, "Maksimal 255 karakter").optional()
})

export const createOrderSchema = z.object({
    customerName: z.string().trim().min(1, "Minimal 1 karakter").max(255, "Maksimal 255 karakter"),

    items: z.array(orderItemSchema).min(1, "Minimal 1 item"),

    paymentMethod: z.enum(["CASH", "QRIS"]),

    cashGiven: z.number().int().min(0).optional()
}).refine((data) => {
    if(data.paymentMethod === "CASH"){

       return data.cashGiven !== undefined 
    }

    return true;
})

export const kdsStatusUpdateSchema = z.object({
    status: z.enum(["IN_PROGRESS", "READY", "COMPLETED"]),
});