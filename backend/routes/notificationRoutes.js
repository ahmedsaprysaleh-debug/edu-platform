const express = require("express");
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.get("/unread-count", protect, getUnreadCount);
// التعديل هنا: خلينا read-all قبل :notificationId/read
router.patch("/read-all", protect, markAllAsRead); 
router.patch("/:notificationId/read", protect, markAsRead);

module.exports = router;