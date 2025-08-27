import validator from "validator";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
  try {
    const { firstname, lastname, gender, email, phone, password, age } =
      req.body;

    const missingFields = [];

    if (!firstname) missingFields.push("firstname");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone");
    if (!password) missingFields.push("password");
    if (!age) missingFields.push("age");
    if (!gender) missingFields.push("gender");

    if (missingFields?.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Some fields are missing",
        missingFields,
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Email or phone already exist.",
      });
    }

    const newUser = await User.create({
      firstname,
      lastname: lastname || "",
      email,
      phone,
      password,
      age,
      gender,
    });

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: "User signup successfully",
      userId: newUser?._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    const user = await User.findOne({ $or: [{ email }, { phone }] });

    const isPassword = await user?.isPassword(password);

    if (!user || !isPassword) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Invalid email/phone or password",
      });
    }

    const token = await user.generateToken();

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      statusCode: 201,
      message: "User logged successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server error",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server error",
    });
  }
};
