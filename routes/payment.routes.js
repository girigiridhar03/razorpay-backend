import express from "express";
import {
  createOrder,
  verifyPayment,
  webhook,
} from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/creater-order", authMiddleware, createOrder);
paymentRouter.post("/verify-payment", authMiddleware, verifyPayment);
paymentRouter.post("/webhook", express.raw({ type: "application/json" }), webhook);

export default paymentRouter;
