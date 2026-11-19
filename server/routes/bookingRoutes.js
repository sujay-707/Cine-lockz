
const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");
const customerOnly = require("../middleware/customerOnly");

// Create a pending booking — authenticated customers only
router.post(
  "/create",
  protect,
  customerOnly,
  bookingController.createBooking
);

module.exports = router;
