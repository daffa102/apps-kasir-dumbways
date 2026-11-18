import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { createCategorySchema } from "./../schemas/category.schema";
import { success } from "zod";
import { error } from 'node:console';

const prisma = new PrismaClient();

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: { menus: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error pada getAllCategories:", error);
    return res.status(500).json({
      success: false,
      messages: "Terjadi kesalahan pada server",
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const validation = createCategorySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        messages: "Category tidak berhasil",
        errors: validation.error.format(),
      });
    }

    const name = validation.data.name;

    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        messages: "Kategori sudah ada dengan nama tersebut",
      });
    }

    const newCategory = await prisma.category.create({
      data: { name },
    });

    return res.status(201).json({
      success: true,
      messages: "Kategori berhasil ditambahkan",
      data: newCategory,
    });
  } catch (error){
    console.error("error pada createCategory: ", error);
    return res.status(500).json({
        success:false,
        messages: "Terjadi kesalahan pada server"
    });
  }
};

export const updateCategory =async (req:Request, res: Response) => {
    try{
        const id = req.params.id as string;

        const validation = createCategorySchema.safeParse(req.body);

        if(!validation.success){
            return res.status(400).json({
                messages: "Bad request",
                errors: validation.error.format(),
            });
        };

        const {name} = validation.data;

        const category = await prisma.category.findUnique({
            where: { id },
        });

        if(!category){
            return res.status(404).json({
                success: false,
                Messages: "Kategory tidak ditemukan"
            });
        };


        const duplicate = await prisma.category.findFirst({
            where:{
                name: {equals: name, mode:"insensitive"},
                NOT: {id},
            },
        });

        if(duplicate){
            return res.status(400).json({
                messages: "Nama sudah digunakan",
                success:false,
            })
        };

        const updateCategory = await prisma.category.update({
            where: { id },
            data: { name },
        });

        return res.status(200).json({
            success:true,
            messages: "Kategori berhasil diperbarui",
        });


    } catch(error){
    console.error("error pada updateCategory", error);
    return res.status(500).json({
        messages: "terjadi kesalahan pada server"
    });
    }
};

export const deleteCategory = async (req: Request, res:Response) =>{
    try{
    const id = req.params.id as string;

    const category = await prisma.category.findUnique({
        where: { id }
    });

    if(!category){
        return res.status(404).json({
            success: false,
            messages: "Kategori tidak ditemukan",
        })
    };

    const menuCount = await prisma.menu.count({
        where: {categoryId: id},
    });

    if(menuCount > 0 ){
        return res.status(400).json({
            success: false,
            messages: "Kategori tidak dapat dihapus, hapus menu terlebih dahulu",
        })
    };

    await prisma.category.delete({
        where: {id},
    });

    return res.status(200).json({
        success: true,
        messages: "Data berhasil dihapus",
    });

    }catch(error){
        console.error("Terjadi error pada deleteCategory:", error);
        return res.status(500).json({
            messages: "Terjadi kesalahan pada server"
        })
        
    }
}
