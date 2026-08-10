const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["vodafone_cash", "instapay", "card"], required: true },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymobOrderId: String,
    paymobTransactionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
