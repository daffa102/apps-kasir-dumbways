import { z } from "zod";

export const kdsOrderStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "COMPLETED",
]);

export const kdsOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  createdAt: z.string().datetime(),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  status: kdsOrderStatusSchema,
  items: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int().positive(),
      note: z.string().nullable(),
      menu: z.object({ name: z.string() }),
    }),
  ),
});

export const kdsOrdersResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(kdsOrderSchema),
});

export type KdsOrder = z.infer<typeof kdsOrderSchema>;
export type KdsOrderStatus = z.infer<typeof kdsOrderStatusSchema>;
