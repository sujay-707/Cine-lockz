
const crypto = require("crypto");

const mongoose = require("mongoose");
const Seat = require("../models/Seat");
const Show = require("../models/Show");
const Theatre = require("../models/Theatre");
const { generateSeats } = require("../config/seatingLayouts");

const SEAT_LOCK_DURATION_MS = 5 * 60 * 1000;

/**
 * Generate and save seat inventory for a show.
 */
const generateSeatsForShow = async (showId) => {
  const show = await Show.findById(showId);

  if (!show) {
    throw new Error("Show not found.");
  }

  if (show.status === "cancelled") {
    throw new Error("Cannot generate seats for a cancelled show.");
  }

  const existingCount = await Seat.countDocuments({
    show: show._id,
  });

  if (existingCount > 0) {
    throw new Error("Seat inventory already exists for this show.");
  }

  const theatre = await Theatre.findById(show.theatre);

  if (!theatre) {
    throw new Error("Theatre not found.");
  }

  const selectedScreen = theatre.screens.id(show.screen.screenId);

  if (!selectedScreen) {
    throw new Error("Selected screen was not found in the theatre.");
  }

  if (!selectedScreen.isActive) {
    throw new Error("Selected screen is inactive.");
  }

  if (show.format !== selectedScreen.screenType) {
    throw new Error(
      "Show technology does not match the selected screen."
    );
  }

  const layoutId = selectedScreen.layoutId;

  const generatedInventory = generateSeats({
    layoutId,
    totalSeats: selectedScreen.totalSeats,
    ticketPrices: {
      regular: show.ticketPrices.regular,
      premium: show.ticketPrices.premium,
      recliner: show.ticketPrices.recliner,
    },
  });

  const documents = generatedInventory.seats.map((seat) => ({
    show: show._id,
    theatre: theatre._id,
    screenId: selectedScreen._id,
    seatId: seat.seatId,
    seatLabel: seat.seatLabel,
    row: seat.row,
    rowNumber: seat.rowNumber,
    seatNumber: seat.seatNumber,
    columnNumber: seat.columnNumber,
    category: seat.category,
    price: seat.price,
    status: "available",
  }));

  const insertedSeats = await Seat.insertMany(documents, {
    ordered: true,
  });

  return {
    showId: show._id,
    theatreId: theatre._id,
    screenId: selectedScreen._id,
    layoutId,
    layoutName: generatedInventory.layoutName,
    totalRows: generatedInventory.totalRows,
    totalSeats: insertedSeats.length,
    categoryCounts: insertedSeats.reduce((counts, seat) => {
      counts[seat.category] = (counts[seat.category] || 0) + 1;
      return counts;
    }, {}),
  };
};

/**
 * Release expired locks for a show.
 *
 * Expired seat documents are retained.
 * Only their lock status and lock details are reset.
 */
const releaseExpiredLocks = async (showId) => {
  const now = new Date();

  const result = await Seat.updateMany(
    {
      show: showId,
      status: "locked",
      lockExpiresAt: { $lte: now },
    },
    {
      $set: {
        status: "available",
        lockToken: null,
        lockedBy: null,
        lockExpiresAt: null,
      },
    }
  );

  return result.modifiedCount;
};

/**
 * Temporarily lock selected seats for five minutes.
 *
 * seatIds must contain MongoDB Seat document _id values,
 * not the physical seatId strings.
 *
 * userId is optional because guest checkout is supported.
 */
const lockSeatsForBooking = async ({
  showId,
  seatIds,
  userId = null,
}) => {
  if (!mongoose.Types.ObjectId.isValid(showId)) {
    throw new Error("Invalid show ID.");
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error("Please select at least one seat.");
  }

  if (seatIds.length > 10) {
    throw new Error("You can select a maximum of 10 seats.");
  }

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID.");
  }

  const normalizedSeatIds = seatIds.map((id) => String(id));

  if (new Set(normalizedSeatIds).size !== normalizedSeatIds.length) {
    throw new Error("Duplicate seats were submitted.");
  }

  for (const id of normalizedSeatIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("One or more seat IDs are invalid.");
    }
  }

  const show = await Show.findById(showId).select("_id status");

  if (!show) {
    throw new Error("Show not found.");
  }

  if (show.status !== "scheduled") {
    throw new Error("Seats cannot be locked for this show.");
  }

  // Clear expired locks before attempting new locks.
  await releaseExpiredLocks(showId);

  const lockToken = crypto.randomUUID();
  const now = new Date();
  const lockExpiresAt = new Date(
    now.getTime() + SEAT_LOCK_DURATION_MS
  );

  const lockedSeats = [];

  try {
    for (const seatId of normalizedSeatIds) {
      // Atomic conditional update:
      // only available seats can be locked.
      const seat = await Seat.findOneAndUpdate(
        {
          _id: seatId,
          show: showId,
          $or: [
            { status: "available" },
            {
              status: "locked",
              lockExpiresAt: { $lte: now },
            },
          ],
        },
        {
          $set: {
            status: "locked",
            lockToken,
            lockedBy: userId || null,
            lockExpiresAt,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!seat) {
        throw new Error(
          `Seat ${seatId} is no longer available. Please refresh the seat layout.`
        );
      }

      lockedSeats.push(seat);
    }

    return {
      lockToken,
      showId,
      expiresAt: lockExpiresAt,
      lockDurationSeconds: SEAT_LOCK_DURATION_MS / 1000,
      seats: lockedSeats,
      totalSeats: lockedSeats.length,
      totalPrice: lockedSeats.reduce(
        (total, seat) => total + seat.price,
        0
      ),
    };
  } catch (error) {
    // Compensating rollback:
    // release only seats locked by this attempt.
    await Seat.updateMany(
      {
        show: showId,
        lockToken,
        status: "locked",
      },
      {
        $set: {
          status: "available",
          lockToken: null,
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );

    throw error;
  }
};

/**
 * Release seats belonging to a particular lock attempt.
 */
const releaseSeatsLock = async ({ showId, lockToken }) => {
  if (!mongoose.Types.ObjectId.isValid(showId)) {
    throw new Error("Invalid show ID.");
  }

  if (!lockToken || typeof lockToken !== "string") {
    throw new Error("A valid lock token is required.");
  }

  const result = await Seat.updateMany(
    {
      show: showId,
      lockToken,
      status: "locked",
    },
    {
      $set: {
        status: "available",
        lockToken: null,
        lockedBy: null,
        lockExpiresAt: null,
      },
    }
  );

  return {
    releasedCount: result.modifiedCount,
  };
};

/**
 * Get seat inventory for a particular show.
 */
const getSeatsForShow = async (showId) => {
  await releaseExpiredLocks(showId);

  return Seat.find({ show: showId }).sort({
    rowNumber: 1,
    columnNumber: 1,
  });
};

module.exports = {
  generateSeatsForShow,
  getSeatsForShow,
  releaseExpiredLocks,
  lockSeatsForBooking,
  releaseSeatsLock,
};
