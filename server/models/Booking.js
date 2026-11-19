
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Unique customer-facing booking reference
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Connect booking to its temporary seat lock
    lockToken: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
    },

    // Optional for guest checkout
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Customer details for guest or registered checkout
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          "Please enter a valid email address",
        ],
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Theatre",
      required: true,
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    seats: [
      {
        seat: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seat",
          required: true,
        },

        seatLabel: {
          type: String,
          required: true,
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
      },
    ],

    seatCount: {
      type: Number,
      required: true,
      min: 1,
    },

    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },

      convenienceFee: {
        type: Number,
        default: 0,
        min: 0,
      },

      tax: {
        type: Number,
        default: 0,
        min: 0,
      },

      discount: {
        type: Number,
        default: 0,
        min: 0,
      },

      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "expired"],
      default: "pending",
      index: true,
    },

    payment: {
      status: {
        type: String,
        enum: ["pending", "success", "failed", "refunded"],
        default: "pending",
      },

      method: {
        type: String,
        enum: ["upi", "card", "netbanking", "wallet", "cash", "other"],
        default: "other",
      },

      provider: {
        type: String,
        default: "",
      },

      transactionId: {
        type: String,
        default: "",
      },

      paidAt: {
        type: Date,
        default: null,
      },
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    refund: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        enum: ["not_applicable", "pending", "processed", "failed"],
        default: "not_applicable",
      },

      transactionId: {
        type: String,
        default: "",
      },

      processedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Customer booking history
bookingSchema.index({ user: 1, createdAt: -1 });

// Guest booking lookup
bookingSchema.index({ "customer.email": 1, createdAt: -1 });

// Show booking queries
bookingSchema.index({ show: 1, bookingStatus: 1 });

// Admin filters
bookingSchema.index({
  bookingStatus: 1,
  "payment.status": 1,
  createdAt: -1,
});

module.exports = mongoose.model("Booking", bookingSchema);
