import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createOrderSchema } from "../schemas/order.schema";
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
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: { items: { include: { menu: true } } },
    orderBy: { createdAt: "asc" },
  });

  return res.status(200).json({
    success: true,
    data: orders,
  });
};
