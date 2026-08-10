const axios = require("axios");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Course = require("../models/Course");

const PAYMOB_BASE = "https://accept.paymob.com/api";

// الخطوة 1: الحصول على auth token من Paymob
async function getAuthToken() {
  const { data } = await axios.post(`${PAYMOB_BASE}/auth/tokens`, {
    api_key: process.env.PAYMOB_API_KEY,
  });
  return data.token;
}

// الخطوة 2: إنشاء أوردر
async function createOrder(authToken, amountCents, merchantOrderId) {
  const { data } = await axios.post(`${PAYMOB_BASE}/ecommerce/orders`, {
    auth_token: authToken,
    delivery_needed: false,
    amount_cents: amountCents,
    currency: "EGP",
    merchant_order_id: merchantOrderId,
  });
  return data;
}

// الخطوة 3: الحصول على payment key حسب طريقة الدفع (كارت / محفظة)
async function getPaymentKey(authToken, order, amountCents, billingData, integrationId) {
  const { data } = await axios.post(`${PAYMOB_BASE}/acceptance/payment_keys`, {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: order.id,
    billing_data: billingData,
    currency: "EGP",
    integration_id: integrationId,
  });
  return data.token;
}

// بدء عملية الدفع - method: "vodafone_cash" | "instapay" | "card"
exports.initiatePayment = async (req, res) => {
  try {
    const { courseId, method, mobileNumber } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "الكورس مش موجود" });

    const amountCents = Math.round(course.price * 100);
    const authToken = await getAuthToken();

    const payment = await Payment.create({
      user: req.user._id,
      course: course._id,
      amount: course.price,
      method,
      status: "pending",
    });

    const order = await createOrder(authToken, amountCents, payment._id.toString());
    payment.paymobOrderId = order.id;
    await payment.save();

    const billingData = {
      first_name: req.user.name.split(" ")[0] || "Student",
      last_name: req.user.name.split(" ")[1] || "User",
      email: req.user.email,
      phone_number: mobileNumber || "+201027218581",
      apartment: "NA", floor: "NA", street: "NA", building: "NA",
      city: "Cairo", country: "EG", state: "NA",
    };

    // فودافون كاش وانستا باي بيتعاملوا كـ "محفظة" في Paymob غالبًا (Mobile Wallet integration)
    const integrationId =
      method === "card"
        ? process.env.PAYMOB_INTEGRATION_ID_CARD
        : process.env.PAYMOB_INTEGRATION_ID_WALLET;

    const paymentKey = await getPaymentKey(authToken, order, amountCents, billingData, integrationId);

    if (method === "vodafone_cash" || method === "instapay") {
      // استخدام Wallet Pay API - بيرجع رابط أو كود تأكيد يتبعت للطالب
      const walletRes = await axios.post(
        `${PAYMOB_BASE}/acceptance/payments/pay`,
        {
          source: { identifier: mobileNumber, subtype: "WALLET" },
          payment_token: paymentKey,
        }
      );
      return res.json({ paymentId: payment._id, redirectUrl: walletRes.data.redirect_url || null, raw: walletRes.data });
    }

    // للكارت: نرجع رابط الـ iframe
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;
    res.json({ paymentId: payment._id, iframeUrl });
  } catch (err) {
    res.status(500).json({ message: "فشل بدء عملية الدفع", error: err.response?.data || err.message });
  }
};

// Webhook - Paymob بيبعت تأكيد الدفع هنا (لازم تسجل الرابط ده في داشبورد Paymob)
exports.paymobWebhook = async (req, res) => {
  try {
    const data = req.body.obj;
    const hmacReceived = req.query.hmac;

    // التحقق من الـ HMAC (مهم جدًا عشان محدش يزور طلبات دفع وهمية)
    const concatenatedString = [
      data.amount_cents, data.created_at, data.currency, data.error_occured,
      data.has_parent_transaction, data.id, data.integration_id, data.is_3d_secure,
      data.is_auth, data.is_capture, data.is_refunded, data.is_standalone_payment,
      data.is_voided, data.order.id, data.owner, data.pending,
      data.source_data.pan, data.source_data.sub_type, data.source_data.type, data.success,
    ].join("");

    const calculatedHmac = crypto
      .createHmac("sha512", process.env.PAYMOB_HMAC_SECRET)
      .update(concatenatedString)
      .digest("hex");

    if (calculatedHmac !== hmacReceived) {
      return res.status(400).json({ message: "HMAC غير متطابق - الطلب مرفوض" });
    }

    const payment = await Payment.findOne({ paymobOrderId: data.order.id });
    if (payment) {
      payment.status = data.success ? "paid" : "failed";
      payment.paymobTransactionId = data.id;
      await payment.save();
      if (data.success) {
  const User = require("../models/User");
  await User.findByIdAndUpdate(payment.user, { $addToSet: { enrolledCourses: payment.course } });
}
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyPayments = async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).populate("course", "title price");
  res.json(payments);
};
