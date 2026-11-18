import Router from "express";
import { getAllCategories, createCategory, updateCategory, deleteCategory} from './../controllers/category.controller';
import { verifyToken, checkRole } from "../middleware/auth.middleware";


const router = Router();

router.use(verifyToken);

router.get("/", getAllCategories);
router.post("/", checkRole(["ADMIN"]), createCategory);
router.put("/:id", checkRole(["ADMIN"]), updateCategory);
router.delete("/:id", checkRole(["ADMIN"]), deleteCategory);

export default router;