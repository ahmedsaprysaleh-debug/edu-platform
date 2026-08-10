const express = require("express");
const {
  getAllUsers, updateUserRole, toggleUserActive, deleteUser, getStats,
} = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/auth");

const router = express.Router();
router.use(protect, restrictTo("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/toggle-active", toggleUserActive);
router.delete("/users/:id", deleteUser);
router.get("/stats", getStats);

module.exports = router;
