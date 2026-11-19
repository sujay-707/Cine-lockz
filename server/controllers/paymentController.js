const crypto = require("crypto");

const Booking = require("../models/Booking");
const Seat = require("../models/Seat");
const Ticket = require("../models/Ticket");

// Generate unique demo transaction reference
const generateTransactionId = () => {
  return `CLZ-DEMO-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// Generate unique ticket reference
const generateTicketId = () => {
  return `CLZ-TKT-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
};

// Generate an opaque QR verification token
const generateQrToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const confirmDemoPayment = async (req, res, next) => {
  let booking = null;
  let transactionId = null;
  let createdTicketIds = [];
  let updatedSeatIds = [];

  try {
    const { bookingId } = req.params;
    const { method = "other" } = req.body;

    const allowedMethods = ["upi", "card", "netbanking", "wallet", "other"];

    if (!bookingId || typeof bookingId !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid booking ID is required.",
      });
    }

    if (!allowedMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid demo payment method.",
      });
    }

    booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }
    // Verify authenticated customer owns this booking.
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only customer accounts can make payments.",
      });
    }

    if (!booking.user || booking.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this booking.",
      });
    }

    // Idempotency: return existing tickets for an already confirmed booking
    if (booking.bookingStatus === "confirmed") {
      const existingTickets = await Ticket.find({
        booking: booking._id,
      })
        .select("+qrCode")
        .sort({ createdAt: 1 });

      return res.status(200).json({
        success: true,
        message: "Booking is already confirmed.",
        data: {
          bookingId: booking.bookingId,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.payment.status,
          tickets: existingTickets.map((ticket) => ({
            ticketId: ticket.ticketId,
            seatLabel: ticket.seatLabel,
            category: ticket.category,
            price: ticket.price,
            qrCode: ticket.qrCode,
            status: ticket.status,
          })),
          demoMode: true,
        },
      });
    }

    if (
      booking.bookingStatus !== "pending" ||
      booking.payment.status !== "pending"
    ) {
      return res.status(409).json({
        success: false,
        message: "This booking cannot be confirmed.",
      });
    }

    const now = new Date();

    if (!booking.expiresAt || booking.expiresAt <= now) {
      await Booking.updateOne(
        {
          _id: booking._id,
          bookingStatus: "pending",
        },
        {
          $set: {
            bookingStatus: "expired",
            cancellationReason: "Booking expired before payment confirmation.",
          },
        },
      );

      await Seat.updateMany(
        {
          show: booking.show,
          lockToken: booking.lockToken,
          status: "locked",
        },
        {
          $set: {
            status: "available",
            lockToken: null,
            lockedBy: null,
            lockExpiresAt: null,
          },
        },
      );

      return res.status(410).json({
        success: false,
        message: "Booking expired. Please select your seats again.",
      });
    }

    if (!booking.seats || booking.seats.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No seats are associated with this booking.",
      });
    }

    const seatIds = booking.seats.map((item) => item.seat);

    // Verify every seat still belongs to this active lock
    const lockedSeats = await Seat.find({
      _id: { $in: seatIds },
      show: booking.show,
      status: "locked",
      lockToken: booking.lockToken,
      lockExpiresAt: { $gt: now },
    });

    if (lockedSeats.length !== booking.seatCount) {
      return res.status(409).json({
        success: false,
        message:
          "One or more seat locks are no longer valid. Please try booking again.",
      });
    }

    // Claim this pending booking atomically to prevent concurrent confirmation
    transactionId = generateTransactionId();

    const claimedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        bookingStatus: "pending",
        "payment.status": "pending",
        "payment.transactionId": "",
        expiresAt: { $gt: now },
      },
      {
        $set: {
          "payment.transactionId": transactionId,
          "payment.method": method,
          "payment.provider": "CineLockz Demo",
        },
      },
      { new: true },
    );

    if (!claimedBooking) {
      return res.status(409).json({
        success: false,
        message:
          "Booking is already being processed or is no longer available.",
      });
    }

    // Lock each seat into its final booked state
    for (const item of booking.seats) {
      const updatedSeat = await Seat.findOneAndUpdate(
        {
          _id: item.seat,
          show: booking.show,
          status: "locked",
          lockToken: booking.lockToken,
          lockExpiresAt: { $gt: new Date() },
        },
        {
          $set: {
            status: "booked",
            booking: booking._id,
            lockToken: null,
            lockedBy: null,
            lockExpiresAt: null,
          },
        },
        { new: true },
      );

      if (!updatedSeat) {
        throw new Error(
          `Could not confirm seat ${item.seatLabel}. Please retry if the booking remains pending.`,
        );
      }

      updatedSeatIds.push(updatedSeat._id);
    }

    // Create one ticket for each booked seat
    const ticketDocuments = booking.seats.map((item) => ({
      ticketId: generateTicketId(),
      booking: booking._id,
      user: booking.user || null,
      show: booking.show,
      movie: booking.movie,
      theatre: booking.theatre,
      seat: item.seat,
      seatLabel: item.seatLabel,
      category: item.category,
      price: item.price,
      qrCode: generateQrToken(),
      status: "valid",
      issuedAt: new Date(),
    }));

    const createdTickets = await Ticket.insertMany(ticketDocuments);

    createdTicketIds = createdTickets.map((ticket) => ticket._id);

    // Finalize booking only after all seats and tickets are ready
    const confirmedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        bookingStatus: "pending",
        "payment.status": "pending",
        "payment.transactionId": transactionId,
      },
      {
        $set: {
          bookingStatus: "confirmed",
          "payment.status": "success",
          "payment.paidAt": new Date(),
          confirmedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!confirmedBooking) {
      throw new Error("Could not finalize booking confirmation.");
    }

    return res.status(200).json({
      success: true,
      message:
        "Demo payment successful. Booking confirmed and tickets generated.",
      data: {
        bookingId: confirmedBooking.bookingId,
        bookingStatus: confirmedBooking.bookingStatus,
        paymentStatus: confirmedBooking.payment.status,
        payment: {
          provider: confirmedBooking.payment.provider,
          method: confirmedBooking.payment.method,
          transactionId: confirmedBooking.payment.transactionId,
          paidAt: confirmedBooking.payment.paidAt,
        },
        pricing: confirmedBooking.pricing,
        tickets: createdTickets.map((ticket) => ({
          ticketId: ticket.ticketId,
          seatLabel: ticket.seatLabel,
          category: ticket.category,
          price: ticket.price,
          qrCode: ticket.qrCode,
          status: ticket.status,
        })),
        demoMode: true,
      },
    });
  } catch (error) {
    // Compensate for partial failures
    try {
      if (createdTicketIds.length > 0) {
        await Ticket.deleteMany({
          _id: { $in: createdTicketIds },
          booking: booking?._id,
        });
      }

      if (updatedSeatIds.length > 0) {
        await Seat.updateMany(
          {
            _id: { $in: updatedSeatIds },
            booking: booking?._id,
            status: "booked",
          },
          {
            $set: {
              status: "locked",
              booking: null,
              lockToken: booking.lockToken,
              lockedBy: null,
              lockExpiresAt: booking.expiresAt,
            },
          },
        );
      }

      if (booking && transactionId) {
        await Booking.updateOne(
          {
            _id: booking._id,
            bookingStatus: "pending",
            "payment.transactionId": transactionId,
          },
          {
            $set: {
              "payment.transactionId": "",
              "payment.method": "other",
              "payment.provider": "",
            },
          },
        );
      }
    } catch (rollbackError) {
      console.error("Payment rollback failed:", rollbackError);
    }

    return next(error);
  }
};

module.exports = {
  confirmDemoPayment,
};
