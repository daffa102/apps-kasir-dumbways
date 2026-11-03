import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

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

    if(!authHeader || !authHeader.startsWith("Bearer"))
    {
       return res.status(401).json({ messages: "Akses ditolak, token ditemukan"})
    }

    const token = authHeader.split(" ")[1];

    try{
        const secret = process.env.JWT_SECRET || "default secret";

        const decoded = jwt.verify(token, secret) as UserPayload;

        req.user = decoded;

        next()
    }catch{
        return res.status(403).json({messages: "Token anda tidak valid, sudah kadaluwarsa"});
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

 
