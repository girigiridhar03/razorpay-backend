import { Payment } from "../models/payment.js";
import { User } from "../models/user.model.js";
import { PLAN_DETAILS } from "../utils/constants.js";
import { instance } from "../utils/razorpayInstance.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan } = req.body;
    const receipt = `order_receipt_${Date.now()}`;
    const planDetails = PLAN_DETAILS[plan];

    const user = await User.findById(userId);

    if (!planDetails) {
      return res.status(400).json({
        success: false,
        statusCode: 401,
        message: "Invalid plan",
      });
    }

    const option = {
      amount: planDetails.price * 100,
      currency: "INR",
      receipt,
      notes: {
        plan,
        userId: userId?.toString(),
        name: user.firstname,
        email: user.email,
      },
    };

    const order = await instance.orders.create(option);

    const newpayment = new Payment({
      orderId: order?.id,
      receipt,
      amount: order?.amount / 100,
      notes: {
        plan,
        name: user.firstname,
        email: user.email,
      },
      userid: userId,
      paymenttype: "manual",
    });

    await newpayment.save();

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Order id created",
      order,
      details: newpayment,
      key: process.env.KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server error",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const hamc = crypto.createHmac("sha256", process.env.KEY_SECRET);
    hamc.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generateSignatureId = hamc.digest("hex");

    if (generateSignatureId !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Payment verification failed",
      });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });

    if (!payment) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "Payment not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Already Registered",
        payment,
      });
    }

    payment.paymentId = razorpay_payment_id;
    payment.status = "paid";
    payment.paymenttype = "manual";

    payment.save();

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "Registered",
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal server error",
    });
  }
};

export const webhook = async (req, res) => {
  console.log("Webhook hit! Raw body:", req.body);
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const webhookSignature = req.headers["x-razorpay-signature"];

    const body = req.body.toString(); // convert raw Buffer to string

    const isValidWebHook = validateWebhookSignature(
      body,
      webhookSignature,
      webhookSecret
    );

    if (!isValidWebHook) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Webhook signature is invalid",
      });
    }

    const data = JSON.parse(body); // now parse JSON
    const paymentDetails = data.payload.payment.entity;

    const payment = await Payment.findOne({
      orderId: paymentDetails?.order_id,
    });

    console.log("------------>", data.event, paymentDetails, payment);

    if (data.event === "payment.captured") {
      if (payment) {
        payment.paymenttype = "webhook";
        await payment.save();
      }
    }

    if (data.event === "payment.failed") {
      if (payment) {
        payment.status = "failed";
        payment.paymenttype = "webhook";
        await payment.save();
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server error",
    });
  }
};
