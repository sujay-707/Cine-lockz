
const movieService = require("../services/movieService");
const mongoose = require("mongoose");

const prepareMovieData = (body) => {
  const data = { ...body };

  // Only process genre when it is included in the request.
  if (Object.prototype.hasOwnProperty.call(data, "genre")) {
    if (typeof data.genre === "string") {
      try {
        data.genre = JSON.parse(data.genre);
      } catch {
        data.genre = [data.genre];
      }
    }

    if (!Array.isArray(data.genre)) {
      data.genre = data.genre ? [data.genre] : [];
    }
  }

  // Convert numeric fields only when provided.
  if (data.duration !== undefined) {
    data.duration = Number(data.duration);
  }

  if (data.rating !== undefined) {
    data.rating = Number(data.rating);
  }

  // Normalize status only when provided.
  if (data.status !== undefined) {
    data.status = data.status.toLowerCase();
  }

  return data;
};
// Create movie
exports.createMovie = async (req, res, next) => {
  try {
    const data = prepareMovieData(req.body);

    if (!data.title || !data.title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Movie title is required",
      });
    }

    if (!data.genre.length) {
      return res.status(400).json({
        success: false,
        message: "At least one genre is required",
      });
    }

    if (req.file) {
      data.poster = `/uploads/movies/${req.file.filename}`;
    }

    const slug = data.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const movie = await movieService.createMovie({
      ...data,
      slug,
    });

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// Get all movies
exports.getMovies = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status.toLowerCase();
    }

    const movies = await movieService.getAllMovies(filters);

    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

// Get movie by ID
exports.getMovieById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const movie = await movieService.getMovieById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// Update movie
exports.updateMovie = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const data = prepareMovieData(req.body);

    if (req.file) {
      data.poster = `/uploads/movies/${req.file.filename}`;
    }

    if (data.title) {
      data.slug = data.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const movie = await movieService.updateMovie(
      req.params.id,
      data
    );

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// Delete movie
exports.deleteMovie = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
    }

    const movie = await movieService.deleteMovie(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Movie deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
