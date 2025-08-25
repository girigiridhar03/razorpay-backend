import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const authMiddleware = async (req, res,next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Token is required",
      });
    }

    const decodedToken = await jwt.verify(token, "SECRET_KEY");
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Unauthorized",
    });
  }
};
