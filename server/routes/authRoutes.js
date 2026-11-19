const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Customer signup
router.post("/signup", authController.signup);

// Shared customer and admin login
router.post("/login", authController.login);
// Verify authenticated user
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Admin-only verification
router.get("/admin-check", protect, adminOnly, (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted",
    user: req.user,
  });
});

module.exports = router;
