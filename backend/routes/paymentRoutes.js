const express = require("express");
const {
  initiatePayment, paymobWebhook, getMyPayments,
} = require("../controllers/paymentController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();

router.post("/initiate", protect, restrictTo("student"), initiatePayment);
router.post("/webhook", paymobWebhook); // مفيهاش protect لأن Paymob هو اللي بيناديها
router.get("/my", protect, getMyPayments);

module.exports = router;
