
const Movie = require("../models/Movie");

// Create a movie
const createMovie = async (movieData) => {
  return await Movie.create(movieData);
};

// Get all movies
const getAllMovies = async (filters = {}) => {
  return await Movie.find(filters).sort({ createdAt: -1 });
};

// Get movie by ID
const getMovieById = async (id) => {
  return await Movie.findById(id);
};

// Update movie
const updateMovie = async (id, movieData) => {
  return await Movie.findByIdAndUpdate(id, movieData, {
    new: true,
    runValidators: true,
  });
};

// Delete movie
const deleteMovie = async (id) => {
  return await Movie.findByIdAndDelete(id);
};

module.exports = {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
};
