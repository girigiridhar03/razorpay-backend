import express from "express";
import { checkAuth, login, signup } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const userroute = express.Router();

userroute.post("/signup", signup);
userroute.post("/login", login);
userroute.get("/check-auth", authMiddleware, checkAuth);

export default userroute;
