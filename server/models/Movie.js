const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true },
    genre: { type: [String], required: true },
    language: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 },
    releaseDate: { type: Date, required: true },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    poster: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published"], default: "draft" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Movie", movieSchema);
