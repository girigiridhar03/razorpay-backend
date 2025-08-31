import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
const app = express();

const allowedOrigin = ["http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callBack) {
      if (!origin || allowedOrigin.includes(origin)) {
        callBack(null, true);
      } else {
        callBack(new Error("Not allowed by cors"));
      }
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  if (req.originalUrl === "/payment/webhook") {
    return next();
  }
  return express.json()(req, res, next);
});
app.use(cookieParser());

import userroute from "./routes/user.routes.js";
import paymentRouter from "./routes/payment.routes.js";
app.use("/user", userroute);
app.use("/payment", paymentRouter);

export default app;
