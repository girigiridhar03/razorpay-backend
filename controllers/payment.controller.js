import { Payment } from "../models/payment.js";
import { User } from "../models/user.model.js";
import { PLAN_DETAILS } from "../utils/constants.js";
import { instance } from "../utils/razorpayInstance.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan } = req.body;
    const receipt = `order_receipt_${Date.now()}`;
    const planDetails = PLAN_DETAILS[plan];

    console.log("plandetails", planDetails);

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

// {razorpay_payment_id: 'pay_R9Abc4IGX5aTKC', razorpay_order_id: 'order_R9AbD6isUzwpCZ', razorpay_signature: '24d141a175a1cf844e68614b80a2895de0f1856e3feffe15d835ce28c7045ab0'}
// razorpay_order_id
// :
// "order_R9AbD6isUzwpCZ"
// razorpay_payment_id
// :
// "pay_R9Abc4IGX5aTKC"
// razorpay_signature
// :
// "24d141a175a1cf844e68614b80a2895de0f1856e3feffe15d835ce28c7045ab0"

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
