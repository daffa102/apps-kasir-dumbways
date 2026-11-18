import { createOrder, getKdsOrders } from "../controllers/order.controller";
import Router from "express";
import { verifyToken, checkRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);
router.get("/kds", checkRole(["BARISTA"]), getKdsOrders);
router.post("/", checkRole(["CASHIER"]), createOrder);


export default router;