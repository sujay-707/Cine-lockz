
const mongoose = require("mongoose");

const Seat = require("../models/Seat");
const seatService = require("../services/seatService");

/**
 * Lock selected seats for an authenticated customer.
 *
 * POST /api/seats/:showId/lock
 */
const lockSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body;

    if (!req.user?.id || req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in customers can lock seats.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
      });
    }

    const result = await seatService.lockSeatsForBooking({
      showId,
      seatIds,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Seats locked successfully for 5 minutes.",
      data: result,
    });
  } catch (error) {
    const clientErrors = [
      "Show not found.",
      "Seats cannot be locked for this show.",
      "Please select at least one seat.",
      "You can select a maximum of 10 seats.",
      "Duplicate seats were submitted.",
      "One or more seat IDs are invalid.",
    ];

    const isClientError =
      clientErrors.includes(error.message) ||
      error.message.startsWith("Seat ") ||
      error.message.startsWith("Invalid ");

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: error.message || "Unable to lock seats.",
    });
  }
};

/**
 * Release temporary seat locks belonging to the authenticated customer.
 *
 * DELETE /api/seats/:showId/lock
 */
const releaseSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const { lockToken } = req.body;

    if (!req.user?.id || req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only logged-in customers can release seat locks.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
      });
    }

    if (!lockToken || typeof lockToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid lock token is required.",
      });
    }

    // Verify that the lock belongs to this customer.
    const lockedSeats = await Seat.find({
      show: showId,
      lockToken,
      status: "locked",
    }).select("_id lockedBy");

    if (lockedSeats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active seats found for this lock.",
      });
    }

    const ownsAllSeats = lockedSeats.every(
      (seat) =>
        seat.lockedBy &&
        seat.lockedBy.toString() === req.user.id.toString()
    );

    if (!ownsAllSeats) {
      return res.status(403).json({
        success: false,
        message: "You cannot release another customer's seat locks.",
      });
    }

    const result = await seatService.releaseSeatsLock({
      showId,
      lockToken,
    });

    return res.status(200).json({
      success: true,
      message: "Your seat locks have been released successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to release seat locks.",
    });
  }
};

module.exports = {
  lockSeats,
  releaseSeats,
};
