
const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

const {
  protect,
} = require("../middleware/authMiddleware");

const customerOnly = require("../middleware/customerOnly");

// Confirm demo payment — authenticated customers only.
router.post(
  "/:bookingId/confirm",
  protect,
  customerOnly,
  paymentController.confirmDemoPayment
);

module.exports = router;
