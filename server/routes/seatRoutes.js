
const express = require("express");
const router = express.Router();

const seatController = require("../controllers/seatController");
const seatLockController = require("../controllers/seatLockController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const customerOnly = require("../middleware/customerOnly");

// Generate seat inventory — admins only.
router.post(
  "/:showId/generate",
  protect,
  adminOnly,
  seatController.generateSeats
);

// View seat inventory — public.
router.get("/:showId", seatController.getSeats);

// Lock selected seats — authenticated customers only.
router.post(
  "/:showId/lock",
  protect,
  customerOnly,
  seatLockController.lockSeats
);

// Release seat locks — authenticated customers only.
router.delete(
  "/:showId/lock",
  protect,
  customerOnly,
  seatLockController.releaseSeats
);

module.exports = router;
