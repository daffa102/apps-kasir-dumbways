import {
  archiveCompletedKdsOrder,
  archiveCompletedKdsOrders,
  createOrder,
  getKdsOrders,
  updateKdsOrderStatus,
} from "../controllers/order.controller";
import Router from "express";
import { verifyToken, checkRole } from "../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);
router.get("/kds", checkRole(["BARISTA"]), getKdsOrders);
router.patch(
  "/kds/archive-completed",
  checkRole(["BARISTA"]),
  archiveCompletedKdsOrders,
);
router.patch("/:id/status", checkRole(["BARISTA"]), updateKdsOrderStatus);
router.patch("/:id/archive", checkRole(["BARISTA"]), archiveCompletedKdsOrder);
router.post("/", checkRole(["CASHIER"]), createOrder);


export default router;