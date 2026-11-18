import { midtransNotificationSchema } from "../schemas/midtrans.schema";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Server } from "socket.io";

const prisma = new PrismaClient();

export const midtransNotification = async (req: Request, res: Response) => {
  const validation = midtransNotificationSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      messages: "Notifikasi tidak valid",
    });
  }

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
  } = validation.data;

  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    return res.status(500).json({
      success: false,
      messages: "Server key midtrans tidak ditemukan",
    });
  }

  const signaturePayload = order_id + status_code + gross_amount + serverKey;

  const expectedSignature = createHash("sha512")
    .update(signaturePayload)
    .digest("hex");

  const hasValidSignatureFormat = /^[0-9a-f]{128}$/i.test(signature_key);
  const receivedBuffer = Buffer.from(signature_key, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  const signatureIsValid =
    hasValidSignatureFormat &&
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer);

  if (!signatureIsValid) {
    return res.status(401).json({
      success: false,
      messages: "Signature notifikasi Midtrans tidak valid",
    });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: order_id },
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      messages: "order tidak ditemukan",
    });
  }

  const receivedAmount = Number(gross_amount);

  if (
    !Number.isFinite(receivedAmount) ||
    receivedAmount !== order.totalAmount ||
    order.paymentMethod !== "QRIS"
  ) {
    return res.status(409).json({
      success: false,
      messages: "Nominal atau metode pembayaran tidak sesuai dengan order",
    });
  }

  const isSuccessfulTransaction =
    status_code === "200" &&
    (transaction_status === "settlement" || transaction_status === "capture") &&
    (fraud_status === undefined || fraud_status === "accept");

  const isFailedTransaction =
    transaction_status === "deny" ||
    transaction_status === "cancel" ||
    transaction_status === "expire" ||
    transaction_status === "failure" ||
    fraud_status === "deny";

  if (isSuccessfulTransaction) {
    const paidTransition = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: "PENDING" },
      data: { paymentStatus: "PAID" },
    });

    if (paidTransition.count > 0) {
      const io = req.app.get("io") as Server;
      io.to("kds:baristas").emit("kds:orders-updated");

    }
  } else if (isFailedTransaction && order.paymentStatus !== "PAID") {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED" },
    });
  }

  return res.status(200).json({
    success: true,
    messages: "Notifikasi Midtrans berhasil diproses",
  });
};
