
const Show = require("../models/Show");

const createShow = async (showData) => {
  return await Show.create(showData);
};

const getAllShows = async (filters = {}) => {
  return await Show.find(filters)
    .populate("movie", "title slug poster duration language")
    .populate("theatre", "name city state")
    .sort({ showDate: 1, startTime: 1 });
};

const getShowById = async (id) => {
  return await Show.findById(id)
    .populate("movie", "title slug poster duration language")
    .populate("theatre", "name city state");
};

const updateShow = async (id, showData) => {
  return await Show.findByIdAndUpdate(id, showData, {
    new: true,
    runValidators: true,
  })
    .populate("movie", "title slug poster duration language")
    .populate("theatre", "name city state");
};

const deleteShow = async (id) => {
  return await Show.findByIdAndDelete(id);
};

module.exports = {
  createShow,
  getAllShows,
  getShowById,
  updateShow,
  deleteShow,
};
