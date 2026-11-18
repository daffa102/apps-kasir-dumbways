import fs from "fs";
import path from "path";
import multer from "multer";


const uploadDir = path.join(process.cwd(), "uploads", "menus");

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive:true});
}

const storage = multer.diskStorage({
    destination: (req, file ,cb ) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) =>{
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random()* 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `menu-${uniqueSuffix}${ext}`)
},
});

const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
) => {
    const allowedTypes = ["image/jpg", "image/webp", "image/png", "image/jpeg"];
    if(allowedTypes.includes(file.mimetype)){
        cb(null, true)
    }else{
        cb(new Error("Format file harus berupa gambar (JPG, WEBP, PNG, JPEG"));
    }
};

export const uploadMenuImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 2*1024*1024
    }
});

