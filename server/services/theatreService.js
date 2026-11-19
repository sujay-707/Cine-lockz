
const Theatre = require("../models/Theatre");

const createTheatre = async (theatreData) => {
  return await Theatre.create(theatreData);
};

const getAllTheatres = async (filters = {}) => {
  return await Theatre.find(filters).sort({ createdAt: -1 });
};

const getTheatreById = async (id) => {
  return await Theatre.findById(id);
};

const updateTheatre = async (id, theatreData) => {
  return await Theatre.findByIdAndUpdate(
    id,
    { $set: theatreData },
    {
      new: true,
      runValidators: true,
      context: "query",
    }
  );
};

const deleteTheatre = async (id) => {
  return await Theatre.findByIdAndDelete(id);
};

module.exports = {
  createTheatre,
  getAllTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
};
