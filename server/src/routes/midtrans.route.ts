import Router from "express";
import { midtransNotification } from "../controllers/midtrans.controller";

const router = Router();

router.post("/", midtransNotification);

export default router;
