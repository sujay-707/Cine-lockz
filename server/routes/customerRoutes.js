
const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

const {
  protect,
} = require("../middleware/authMiddleware");

const customerOnly = require("../middleware/customerOnly");

// All customer endpoints require authentication.
router.use(protect, customerOnly);

router.get("/profile", customerController.getMyProfile);
router.get("/bookings", customerController.getMyBookings);
router.get("/tickets", customerController.getMyTickets);

module.exports = router;
