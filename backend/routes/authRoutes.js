const express = require("express");
const {
  register, login, me, forgotPassword, resetPassword, verifyEmail, resendVerification,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerRules, loginRules, checkValidation } = require("../middleware/validators");

const router = express.Router();

router.post("/register", registerRules, checkValidation, register);
router.post("/login", loginRules, checkValidation, login);
router.get("/me", protect, me);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", protect, resendVerification);

module.exports = router;
