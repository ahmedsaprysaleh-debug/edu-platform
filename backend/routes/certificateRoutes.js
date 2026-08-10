const express = require("express");
const { downloadCertificate } = require("../controllers/certificateController");
const { protect } = require("../middleware/auth");

const router = express.Router();
router.get("/:courseId/pdf", protect, downloadCertificate);

module.exports = router;
