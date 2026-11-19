
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const Theatre = require("../models/Theatre");
const User = require("../models/User");

// Generate a unique customer-facing booking reference.
const generateBookingId = () => {
  return `CLZ-${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
};

// Resolve the actual show start timestamp.
// Existing records may have startAt = null.
// CineLockz operates in India (IST).
const getShowStartDate = (show) => {
  if (show.startAt) {
    return new Date(show.startAt);
  }

  if (!show.showDate || !show.startTime) {
    throw new Error("Show schedule information is incomplete.");
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
    show.startTime
  );

  if (!match) {
    throw new Error("Invalid show start time.");
  }

  const date = new Date(show.showDate);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return new Date(
    `${year}-${month}-${day}T${show.startTime}:00+05:30`
  );
};

/**
 * Create a pending booking for an authenticated customer.
 *
 * POST /api/bookings/create
 *
 * Required request body:
 * {
 *   "lockToken": "active-seat-lock-token",
 *   "customer": {
 *     "phone": "9876543210"
 *   }
 * }
 *
 * Name and email are retrieved from the authenticated account.
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { lockToken } = req.body;

    // 1. Validate authenticated customer.

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    if (
      !lockToken ||
      typeof lockToken !== "string" ||
      lockToken.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid seat lock token is required.",
      });
    }

    // Always retrieve customer information from MongoDB.
    const authenticatedCustomer = await User.findById(
      req.user.id
    ).select("name email phone role isActive");

    if (
      !authenticatedCustomer ||
      !authenticatedCustomer.isActive
    ) {
      return res.status(401).json({
        success: false,
        message: "Your customer account could not be verified. Please log in again.",
      });
    }

    if (authenticatedCustomer.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only customer accounts can create bookings.",
      });
    }

    const name = authenticatedCustomer.name.trim();
    const email = authenticatedCustomer.email
      .trim()
      .toLowerCase();

    // Use the account phone number where available.
    // Otherwise, accept a phone number for this booking.
    const suppliedPhone =
      typeof req.body?.customer?.phone === "string"
        ? req.body.customer.phone.trim()
        : "";

    const phone = (
      authenticatedCustomer.phone ||
      suppliedPhone ||
      ""
    ).trim();

    if (!phone || !/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please add a valid phone number to your account or provide one for this booking.",
      });
    }

    // 2. Prevent lock-token reuse.

    const existingBooking = await Booking.findOne({
      lockToken,
    }).select("_id bookingId bookingStatus");

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "This seat lock has already been used for a booking.",
      });
    }

    // 3. Retrieve active locked seats.

    const now = new Date();

    const lockedSeats = await Seat.find({
      lockToken,
      status: "locked",
      lockExpiresAt: { $gt: now },
    }).sort({
      rowNumber: 1,
      columnNumber: 1,
    });

    if (lockedSeats.length === 0) {
      return res.status(409).json({
        success: false,
        message:
          "Seat lock has expired or is invalid. Please select your seats again.",
      });
    }

    if (lockedSeats.length > 10) {
      return res.status(400).json({
        success: false,
        message: "A booking cannot contain more than 10 seats.",
      });
    }

    // All locked seats must belong to one show.

    const showId = lockedSeats[0].show.toString();

    const allSeatsMatchShow = lockedSeats.every(
      (seat) => seat.show.toString() === showId
    );

    if (!allSeatsMatchShow) {
      return res.status(409).json({
        success: false,
        message: "Seat lock contains seats from different shows.",
      });
    }

    // 4. Validate show.

    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found.",
      });
    }

    if (show.status !== "scheduled") {
      return res.status(409).json({
        success: false,
        message: "This show is not available for booking.",
      });
    }

    const showStartDate = getShowStartDate(show);

    if (showStartDate <= now) {
      return res.status(409).json({
        success: false,
        message:
          "This show has already started or is no longer available.",
      });
    }

    // 5. Validate movie and theatre.

    const [movie, theatre] = await Promise.all([
      Movie.findById(show.movie),
      Theatre.findById(show.theatre),
    ]);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found.",
      });
    }

    if (movie.status !== "published") {
      return res.status(409).json({
        success: false,
        message: "This movie is not available for booking.",
      });
    }

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found.",
      });
    }

    const selectedScreen = theatre.screens.id(
      show.screen.screenId
    );

    if (!selectedScreen || !selectedScreen.isActive) {
      return res.status(409).json({
        success: false,
        message: "The selected screen is unavailable.",
      });
    }

    // 6. Verify seat ownership and consistency.

    const validSeats = lockedSeats.every((seat) => {
      return (
        seat.theatre.toString() === theatre._id.toString() &&
        seat.screenId.toString() ===
          show.screen.screenId.toString() &&
        seat.lockToken === lockToken &&
        seat.lockExpiresAt > now
      );
    });

    if (!validSeats) {
      return res.status(409).json({
        success: false,
        message: "Seat reservation validation failed.",
      });
    }

    // 7. Calculate prices from MongoDB.

    const bookingSeats = lockedSeats.map((seat) => ({
      seat: seat._id,
      seatLabel: seat.seatLabel,
      category: seat.category,
      price: seat.price,
    }));

    const subtotal = bookingSeats.reduce(
      (total, seat) => total + seat.price,
      0
    );

    // Demo checkout: no additional charges configured yet.

    const convenienceFee = 0;
    const tax = 0;
    const discount = 0;

    const total =
      subtotal + convenienceFee + tax - discount;

    // All seats must still have a valid lock expiry.

    const lockExpiry = new Date(
      Math.min(
        ...lockedSeats.map((seat) =>
          new Date(seat.lockExpiresAt).getTime()
        )
      )
    );

    // 8. Create pending booking.

    const booking = await Booking.create({
      bookingId: generateBookingId(),
      lockToken,

      // Associate booking with authenticated customer.
      user: authenticatedCustomer._id,

      customer: {
        name,
        email,
        phone,
      },

      show: show._id,
      theatre: theatre._id,
      movie: movie._id,

      seats: bookingSeats,
      seatCount: bookingSeats.length,

      pricing: {
        subtotal,
        convenienceFee,
        tax,
        discount,
        total,
      },

      bookingStatus: "pending",

      payment: {
        status: "pending",
        method: "other",
        provider: "CineLockz Demo",
      },

      expiresAt: lockExpiry,
    });

    // 9. Return booking details.

    return res.status(201).json({
      success: true,
      message: "Pending booking created successfully.",

      data: {
        bookingId: booking.bookingId,
        bookingStatus: booking.bookingStatus,

        movie: {
          title: movie.title,
          poster: movie.poster,
          language: movie.language,
        },

        theatre: {
          name: theatre.name,
          city: theatre.city,
        },

        screen: show.screen.name,

        show: {
          date: show.showDate,
          startTime: show.startTime,
          endTime: show.endTime,
        },

        seats: bookingSeats.map((seat) => ({
          seatLabel: seat.seatLabel,
          category: seat.category,
          price: seat.price,
        })),

        seatCount: booking.seatCount,
        pricing: booking.pricing,
        expiresAt: booking.expiresAt,
        paymentStatus: booking.payment.status,
        demoMode: true,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This seat lock has already been used or the booking reference conflicts.",
      });
    }

    next(error);
  }
};
