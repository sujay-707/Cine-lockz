const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

router.use(protect, adminOnly);

router.get(
  "/dashboard",
  adminController.getDashboard
);

router.get(
  "/bookings",
  adminController.getAllBookings
);

module.exports = router;