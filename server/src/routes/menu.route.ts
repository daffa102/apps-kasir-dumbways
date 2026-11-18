import { getAllMenu, createMenu, deleteMenu, updateMenu } from "../controllers/menu.controller";
import { verifyToken, checkRole } from "../middleware/auth.middleware";
import { uploadMenuImage } from "../middleware/upload.middleware";
import Router from "express";

const router = Router();

router.use(verifyToken);
router.get("/", getAllMenu);
router.post("/", checkRole(["ADMIN"]), uploadMenuImage.single("image"),   createMenu);
router.patch("/:id", checkRole(["ADMIN"]), uploadMenuImage.single("image"),updateMenu)
router.delete("/:id", checkRole(["ADMIN"]), deleteMenu);
   

export default router;