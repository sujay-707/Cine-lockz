
const mongoose = require("mongoose");

// Fixed screen-to-layout mapping
const SCREEN_LAYOUTS = {
  1: "layout-1",
  2: "layout-2",
  3: "layout-3",
  4: "layout-4",
};

// Allowed screen technologies
const SCREEN_TYPES = [
  "4K Laser",
  "Laser",
  "Dolby",
  "PXL",
];

// Screen schema
const screenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    screenNumber: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4],
    },

    layoutId: {
      type: String,
      required: true,
      enum: ["layout-1", "layout-2", "layout-3", "layout-4"],
    },

    screenType: {
      type: String,
      required: true,
      enum: SCREEN_TYPES,
      default: "4K Laser",
    },

    totalSeats: {
      type: Number,
      required: true,
      min: 1,
      max: 2000,
      validate: {
        validator: Number.isInteger,
        message: "Seat capacity must be a whole number.",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Validate fixed screen-to-layout mapping
screenSchema.pre("validate", function () {
  const expectedLayout = SCREEN_LAYOUTS[this.screenNumber];

  if (expectedLayout && this.layoutId !== expectedLayout) {
    this.invalidate(
      "layoutId",
      `Screen ${this.screenNumber} must use ${expectedLayout}.`
    );
  }
});

// Theatre schema
const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    screens: {
      type: [screenSchema],
      required: true,
      validate: [
        {
          validator: (screens) => {
            if (!Array.isArray(screens) || screens.length !== 4) {
              return false;
            }

            const screenNumbers = screens.map(
              (screen) => Number(screen.screenNumber)
            );

            return [1, 2, 3, 4].every(
              (number) => screenNumbers.filter(
                (value) => value === number
              ).length === 1
            );
          },
          message:
            "A theatre must have exactly four screens: Screen 1, 2, 3 and 4.",
        },
        {
          validator: (screens) => {
            const names = screens.map((screen) =>
              screen.name.trim().toLowerCase()
            );

            return new Set(names).size === names.length;
          },
          message: "Screen names must be unique within a theatre.",
        },
      ],
    },

    amenities: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Theatre", theatreSchema);
