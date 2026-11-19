import { Request, Response } from "express";
import { OrderStatus, PrismaClient } from "@prisma/client";
import {
  createOrderSchema,
  kdsStatusUpdateSchema,
} from "../schemas/order.schema";
import { randomUUID } from "crypto";
import snap from "../config/midtrans";
import type { SnapTransactionResponse } from "midtrans-client";
const prisma = new PrismaClient();
import type { Server } from "socket.io";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const validation = createOrderSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        messages: "Data order ada tidak valid",
        errors: validation.error.format(),
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        messages: "autentikasi tidak tersedia",
      });
    }

    const userId = req.user.id;

    const { customerName, items, paymentMethod, cashGiven } = validation.data;

    const menuIds = items.map((item) => item.menuId);

    const uniqueIds = [...new Set(menuIds)];

    const menus = await prisma.menu.findMany({
      where: {
        id: {
          in: uniqueIds,
        },
      },
    });

    if (uniqueIds.length !== menus.length) {
      return res.status(404).json({
        success: false,
        messages: "Menu tidak berhasil ditemukan",
      });
    }

    const unavailableMenu = menus.find((menu) => !menu.isAvailable);

    if (unavailableMenu) {
      return res.status(409).json({
        success: false,
        messages: "Menu tidak tersedia",
      });
    }

    const orderItems = items.map((item) => {
      const selectedMenu = menus.find((menu) => menu.id === item.menuId);

      if (!selectedMenu) {
        throw new Error("Menu tidak ditemukan");
      }

      const subtotal = selectedMenu.price * item.quantity;

      return {
        menuId: item.menuId,
        quantity: item.quantity,
        price: selectedMenu.price,
        subtotal: subtotal,
        note: item.note ?? null,
      };
    });

    const subtotalAmount = orderItems.reduce((acc, item) => {
      return acc + item.subtotal;
    }, 0);

    const taxRate = 10;

    const taxAmount = Math.round((subtotalAmount * taxRate) / 100);

    const totalAmount = taxAmount + subtotalAmount;

    let changeAmount: number | null = null;

    if (paymentMethod === "CASH") {
      if (cashGiven === undefined || cashGiven < totalAmount) {
        return res.status(400).json({
          success: false,
          messages: "Uang pembayaran tidak mencukupi",
        });
      }
      changeAmount = cashGiven - totalAmount;
    }

    const paymentStatus = paymentMethod === "CASH" ? "PAID" : "PENDING";

    const jakartaDateTime = new Date().toLocaleString("sv-SE", {
      timeZone: "Asia/Jakarta",
    });

    const timestampPart = jakartaDateTime.replace(/[-: ]/g, "");
    const randomPart = randomUUID().replace(/-/g, "");
    const orderNumber = `${timestampPart}_${randomPart}`;

    const saveOrder = await prisma.order.create({
      data: {
        items: { create: orderItems },
        customerName: customerName,
        orderNumber: orderNumber,
        taxRate: taxRate,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        userId: userId,
        paymentMethod: paymentMethod,
        subtotalAmount: subtotalAmount,
        cashGiven: cashGiven ?? null,
        changeAmount: changeAmount,
        paymentStatus: paymentStatus,
      },
    });

    if (paymentMethod === "CASH") {
      const io = req.app.get("io") as Server;
      io.to("kds:baristas").emit("kds:orders-updated");

    }

    let snapPayment: SnapTransactionResponse | null = null;

    if (paymentMethod === "QRIS") {
      try {
        snapPayment = await snap.createTransaction({
          transaction_details: {
            order_id: orderNumber,
            gross_amount: totalAmount,
          },
        });
      } catch (error) {
        console.error("Gagal membuat transaksi Snap:", error);

        const responseData = (error as { response?: { data?: unknown } })
          .response?.data;
        console.error(
          "Detail respons Midtrans:",
          JSON.stringify(responseData, null, 2),
        );

        await prisma.order.update({
          where: { id: saveOrder.id },
          data: { paymentStatus: "FAILED" },
        });

        return res.status(502).json({
          success: false,
          messages: "Gagal membuat transaksi di midtrans",
        });
      }
    }

    return res.status(201).json({
      success: true,
      messages: "Order berhasil dibuat",
      data: saveOrder,
      payment: snapPayment
        ? { token: snapPayment.token, redirectUrl: snapPayment.redirect_url }
        : null,
    });
  } catch (error) {
    console.error("Terjadi kesalahan pada createOrder:", error);
    return res.status(500).json({
      success: false,
      messages: "Terjadi kesalahan pada server",
    });
  }
};

export const getKdsOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        kdsArchivedAt: null,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.IN_PROGRESS,
            OrderStatus.READY,
            OrderStatus.COMPLETED,
          ],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            note: true,
            menu: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Gagal memuat order KDS:", error);
    return res.status(500).json({
      success: false,
      messages: "Gagal memuat tiket KDS",
    });
  }
};

export const updateKdsOrderStatus = async (req: Request, res: Response) => {
  try {
    const validation = kdsStatusUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        messages: "Status tiket tidak valid",
        errors: validation.error.format(),
      });
    }

    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        kdsArchivedAt: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        messages: "Tiket tidak ditemukan",
      });
    }

    if (order.paymentStatus !== "PAID" || order.kdsArchivedAt) {
      return res.status(409).json({
        success: false,
        messages: "Tiket tidak aktif di KDS",
      });
    }

    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.IN_PROGRESS],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.READY],
      [OrderStatus.READY]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };
    const nextStatus = validation.data.status as OrderStatus;

    if (!allowedTransitions[order.status].includes(nextStatus)) {
      return res.status(409).json({
        success: false,
        messages: "Perubahan status tiket tidak diperbolehkan",
      });
    }

    const updateResult = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: order.status,
        paymentStatus: "PAID",
        kdsArchivedAt: null,
      },
      data: { status: nextStatus },
    });

    if (updateResult.count === 0) {
      return res.status(409).json({
        success: false,
        messages: "Tiket sudah berubah. Muat ulang papan KDS.",
      });
    }

    const io = req.app.get("io") as Server;
    io.to("kds:baristas").emit("kds:orders-updated");

    return res.status(200).json({
      success: true,
      data: { id: order.id, status: nextStatus },
    });
  } catch (error) {
    console.error("Gagal memperbarui status tiket KDS:", error);
    return res.status(500).json({
      success: false,
      messages: "Gagal memperbarui status tiket",
    });
  }
};

export const archiveCompletedKdsOrders = async (_req: Request, res: Response) => {
  try {
    const result = await prisma.order.updateMany({
      where: {
        paymentStatus: "PAID",
        status: OrderStatus.COMPLETED,
        kdsArchivedAt: null,
      },
      data: { kdsArchivedAt: new Date() },
    });

    if (result.count > 0) {
      const io = res.app.get("io") as Server;
      io.to("kds:baristas").emit("kds:orders-updated");
    }

    return res.status(200).json({
      success: true,
      data: { archivedCount: result.count },
    });
  } catch (error) {
    console.error("Gagal mengarsipkan tiket KDS:", error);
    return res.status(500).json({
      success: false,
      messages: "Gagal membersihkan tiket selesai",
    });
  }
};

export const archiveCompletedKdsOrder = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        kdsArchivedAt: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        messages: "Tiket tidak ditemukan",
      });
    }

    if (
      order.status !== OrderStatus.COMPLETED ||
      order.paymentStatus !== "PAID" ||
      order.kdsArchivedAt
    ) {
      return res.status(409).json({
        success: false,
        messages: "Hanya tiket selesai yang dapat diarsipkan",
      });
    }

    const result = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.COMPLETED,
        paymentStatus: "PAID",
        kdsArchivedAt: null,
      },
      data: { kdsArchivedAt: new Date() },
    });

    if (result.count === 0) {
      return res.status(409).json({
        success: false,
        messages: "Tiket sudah berubah. Muat ulang papan KDS.",
      });
    }

    const io = req.app.get("io") as Server;
    io.to("kds:baristas").emit("kds:orders-updated");

    return res.status(200).json({
      success: true,
      data: { id: order.id, archived: true },
    });
  } catch (error) {
    console.error("Gagal mengarsipkan tiket KDS:", error);
    return res.status(500).json({
      success: false,
      messages: "Gagal mengarsipkan tiket",
    });
  }
};
