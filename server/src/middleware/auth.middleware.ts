import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/jwt";

export interface UserPayload {
    id: string;
    email: string;
    role: "ADMIN" | "CASHIER" | "BARISTA";
}

declare global {
    namespace Express {
        interface Request{
            user?: UserPayload;
        }
    }
}


export const verifyToken = (req: Request, res: Response, next: NextFunction) => 
{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer "))
    {
       return res.status(401).json({ messages: "Token tidak ditemukan" });
    }

    const token = authHeader.split(" ")[1];

    try{
        const decoded = jwt.verify(token, getJwtSecret()) as UserPayload;

        req.user = decoded;

        next()
    }catch{
        return res.status(401).json({
            messages: "Token tidak valid atau sudah kadaluwarsa",
        });
    }
};

 export const checkRole = (allowedRoles: ("ADMIN" | "BARISTA" | "CASHIER")[]) => {
        return (req: Request, res: Response, next: NextFunction) =>{
            if(!req.user){
                return res.status(401).json({ 
                    messages: `Pengguna tidak terauntikasi`
                })
            }

            if(!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({
                    messages: `Akses terlarang peran ${req.user.role} tidak memiliki izin ke halaman ini,`
                });
            }
            next();
        };

        
    };

 
