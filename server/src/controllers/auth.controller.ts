import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { loginSchema } from "../schemas/auth.schema"

const prisma = new PrismaClient();

export const login = async (req: Request, res: Response) => {
    try{
        const validation = loginSchema.safeParse(req.body);

        if(!validation.success){
            return res.status(400).json({
                messages: "Login tidak berhasil",
                errors: validation.error.format(),
            });
        }

        const {email, password} = validation.data;

        const user = await prisma.user.findUnique({
            where: {email},
        });
        
        if(!user){
            return res.status(401).json({
                messages: "Email atau password salah"
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if(!isValidPassword){
            return res.status(401).json({
                messages: "Email atau password salah "
            });
        }

        const secret = process.env.JWT_SECRET || "default password";

        const token = jwt.sign({
            id: user.id, email:user.email, role:user.role
        },
        secret,
        {expiresIn: "1d"}
    );

    return res.status(200).json({
        messages: "Berhasil login",
        token,
        user:{
            id:user.id,
            name:user.name,
            email:user.email,
            role:user.role
        },
      });
    } catch(error) {
    console.error("error pada login:", error);
    return res.status(500).json({
        messages: "Terjadi kesalahan pada server"
    })
}  
};


export const getMe = async(req: Request, res: Response) => {
    try{

        const userId = req.user?.id;

        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {
                id:true,
                name:true,
                email: true,
                role:true,
                createdAt:true,
            }
        });

        if(!user){
            return res.status(404).json({
                messages: "profil tidak ditemukan"
            });
        };

        return res.status(200).json({
            messages: "Profil berhasil dimuat",
            user,
        });
   } catch (error){
    console.error("Terjadi kesalahan pada getMe:", error);
    return res.status(500).json({
        messages: "Terjadi kesalahan pada server"
    })
   }
}

