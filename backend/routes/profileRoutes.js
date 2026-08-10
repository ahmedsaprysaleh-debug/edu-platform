const express = require("express");
const { getMyProfile } = require("../controllers/profileController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.get("/me", protect, getMyProfile);

module.exports = router;
