const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    // Unique ticket reference
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    // Optional for guest checkout
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
    },

    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },

    seatLabel: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["regular", "premium", "recliner", "vip"],
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Unique opaque verification token for QR generation
    qrCode: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    status: {
      type: String,
      enum: ["valid", "used", "cancelled", "refunded"],
      default: "valid",
      index: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    checkedInAt: {
      type: Date,
      default: null,
    },

    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Efficient ticket searches
ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ show: 1, status: 1 });
ticketSchema.index({ booking: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);
