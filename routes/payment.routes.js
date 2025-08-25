import express from "express";
import {
  createOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const paymentRouter = express.Router();

paymentRouter.post("/creater-order", authMiddleware, createOrder);
paymentRouter.post("/verify-payment", authMiddleware, verifyPayment);

export default paymentRouter;
