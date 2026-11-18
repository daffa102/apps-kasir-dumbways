import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import {
  createMenuSchema,
  UpdateMenuInput,
  updateMenuSchema,
} from "../schemas/menu.schema";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const cleanUploadedFile = async (file?: Express.Multer.File) => {
  if (!file) return;

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    console.error("Gagal membersihkan file", error);
  }
};

const getMenuImagePath = (image: string) =>{
  const prefix = "/uploads/menus/";

  if(!image.startsWith(prefix)) return null;

  const filename = image.slice(prefix.length);

  if(!/^menu-\d+-\d+\.(jpg|jpeg|png|webp)$/i.test(filename)){
    return null;
  };

  return path.join(process.cwd(), "uploads", "menus", filename);
};


export const getAllMenu = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;

    const menus = await prisma.menu.findMany({
      where: categoryId ? { categoryId: categoryId as string } : undefined,
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    console.error("Terjadi kesalahan pada getMenu:", error);
    return res.status(500).json({
      success: false,
      messages: "Terjadi kesalahan pada server",
    });
  }
};

export const createMenu = async (req: Request, res: Response) => {
  let createSucceeded = false;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        messages: "Foto menu wajib diunggah",
      });
    }

    const validation = createMenuSchema.safeParse(req.body);

    if (!validation.success) {
      await cleanUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        messages: "Data tidak valid",
        errors: validation.error.format(),
      });
    }

    const { name, description, price, categoryId } = validation.data;

    const image = `/uploads/menus/${req.file.filename}`;

    const checkCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!checkCategory) {
      await cleanUploadedFile(req.file);

      return res.status(404).json({
        success: false,
        messages: "Kategori tidak ditemukan",
      });
    }

    const newMenu = await prisma.menu.create({
      data: { name, description, price, categoryId, image },
    });

    createSucceeded = true;

    return res.status(201).json({
      success: true,
      messages: "Menu baru berhasil dibuat",
      newMenu,
    });
  } catch (error) {
    if (!createSucceeded) {
      await cleanUploadedFile(req.file);
    }
    console.error("Terjadi kesalahan pada createMenu:", error);
    return res.status(500).json({
      success: false,
      messages: "Terjadi kesalahan pada server",
    });
  }
};

export const deleteMenu = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        messages: "Menu tidak ditemukan",
      });
    }

    await prisma.menu.delete({
      where: { id },
    });

    const oldImagePath = menu.image
      ? getMenuImagePath(menu.image)
      : null;

    if (oldImagePath) {
      try {
        await fs.promises.unlink(oldImagePath);
      } catch (error) {
        console.error("Gagal menghapus gambar lama", error);
      }
    }

    return res.status(200).json({
      success: true,
      messages: "Menu berhasil dihapus",
    });
  } catch (error) {
    console.error("Terjadi kesalahan pada deleteMenu:", error);

    return res.status(500).json({
      success: false,
      messages: "Terjadi kesalahan pada server",
    });
  }
};

export const updateMenu = async (req: Request, res: Response) => {
  let updateSucceeded = false;

  try {
    const id = req.params.id as string;

    const menus = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menus) {
      await cleanUploadedFile(req.file);

      return res.status(404).json({
        messages: "Menu tidak ditemukan",
      });
    }

    const validation = updateMenuSchema.safeParse(req.body);

    if (!validation.success) {
      await cleanUploadedFile(req.file);

      return res.status(400).json({
        success: false,
        messages: "Menu tidak valid",
        errors: validation.error.format(),
      });
    }

    if (validation.data.categoryId !== undefined) {
      const checkCategory = await prisma.category.findUnique({
        where: { id: validation.data.categoryId },
      });

      if (!checkCategory) {
        await cleanUploadedFile(req.file);

        return res.status(404).json({
          success: false,
          messages: "Kategori tidak berhasil ditemukan",
        });
      }
    }

    const updateData: UpdateMenuInput & { image?: string } = {
      ...validation.data,
    };

    if (req.file) {
      updateData.image = `/uploads/menus/${req.file.filename}`;
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: updateData,
    });

    updateSucceeded = true;

    if (req.file && menus.image) {
  const oldImagePath = getMenuImagePath(menus.image);

  if (oldImagePath) {
    try {
      await fs.promises.unlink(oldImagePath);
    } catch (error) {
      console.error("Gagal menghapus gambar lama:", error);
    }
  }
}

    return res.status(200).json({
      success: true,
      messages: "Menu berhasil diperbarui",
      data: updatedMenu,
    });
  } catch (error) {
    console.error("Menu tidak berhasil diperbarui:", error);
    if (!updateSucceeded) {
      await cleanUploadedFile(req.file);
    }
    return res.status(500).json({
      messages: "Terjadi kesalahan pada server",
    });
  }
};
