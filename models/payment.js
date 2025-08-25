import mongoose from "mongoose";
import { PLAN_DETAILS } from "../utils/constants.js";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
      required: true,
    },
    receipt: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    notes: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      plan: {
        type: String,
        enum: ["Silver", "Gold", "Platinum"],
        required: true,
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
      },
    },
    userid: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymenttype: {
      type: String,
      enum: ["manual", "webhook"],
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "paid") {
    const planDetails = PLAN_DETAILS[this.notes.plan];

    if (planDetails) {
      const start = this.notes.startDate || new Date();
      this.notes.startDate = start;
      this.notes.endDate = new Date(
        start.getTime() + planDetails.duration * 24 * 60 * 60 * 1000
      );
      this.amount = planDetails.price;
    }
  }
  next();
});

export const Payment = mongoose.model("Payment", paymentSchema);
