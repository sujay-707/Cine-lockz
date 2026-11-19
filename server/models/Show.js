
const mongoose = require("mongoose");

// Supported CineLockz screen technologies
const SCREEN_TYPES = [
  "4K Laser",
  "Laser",
  "Dolby",
  "PXL",
];

const showSchema = new mongoose.Schema(
  {
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

    screen: {
      screenId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },

      name: {
        type: String,
        required: true,
        trim: true,
      },

      screenType: {
        type: String,
        required: true,
        enum: SCREEN_TYPES,
      },
    },

    // Indian calendar date on which the show starts.
    showDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    // Actual timestamp-based scheduling fields.
    // Optional temporarily for compatibility with existing records.
    startAt: {
      type: Date,
      default: null,
    },

    endAt: {
      type: Date,
      default: null,
    },

    // Movie runtime snapshot in minutes.
    runtimeMinutes: {
      type: Number,
      min: 1,
      default: null,
    },

    // Cleaning and screen turnaround time.
    turnaroundMinutes: {
      type: Number,
      min: 0,
      default: 15,
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    // Must match the selected theatre screen technology.
    format: {
      type: String,
      enum: SCREEN_TYPES,
      required: true,
    },

    ticketPrices: {
      regular: {
        type: Number,
        required: true,
        min: 0,
      },

      premium: {
        type: Number,
        required: true,
        min: 0,
      },

      recliner: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

// Efficient lookup of shows belonging to a particular screen.
showSchema.index({
  theatre: 1,
  "screen.screenId": 1,
  showDate: 1,
});

// Timestamp-based schedule lookup.
showSchema.index({
  theatre: 1,
  "screen.screenId": 1,
  startAt: 1,
  endAt: 1,
});

// Useful for movie and theatre schedule queries.
showSchema.index({
  movie: 1,
  status: 1,
});

showSchema.index({
  theatre: 1,
  status: 1,
});

module.exports = mongoose.model("Show", showSchema);
