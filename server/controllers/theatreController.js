
const mongoose = require("mongoose");
const theatreService = require("../services/theatreService");

const SCREEN_LAYOUTS = {
  1: "layout-1",
  2: "layout-2",
  3: "layout-3",
  4: "layout-4",
};

const SCREEN_TYPES = [
  "2D",
  "3D",
  "IMAX",
  "4DX",
  "Dolby Atmos",
  "4K Laser",
  "Laser",
  "Dolby",
  "PXL",
];

const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Automatically assign fixed layouts based on screen order.
const prepareScreens = (screens) => {
  if (!Array.isArray(screens)) {
    throw new Error("Screens must be provided as an array.");
  }

  if (screens.length !== 4) {
    throw new Error("A theatre must have exactly four screens.");
  }

  return screens.map((screen, index) => {
    const screenNumber = index + 1;

    const totalSeats = Number(screen.totalSeats);

    if (
      !Number.isInteger(totalSeats) ||
      totalSeats < 1 ||
      totalSeats > 2000
    ) {
      throw new Error(
        `Screen ${screenNumber} must have a valid seat capacity between 1 and 2000.`
      );
    }

    const screenType = screen.screenType || "2D";

    if (!SCREEN_TYPES.includes(screenType)) {
      throw new Error(
        `Invalid screen technology for Screen ${screenNumber}.`
      );
    }

    return {
      ...screen,
      name: screen.name?.trim() || `Screen ${screenNumber}`,
      screenNumber,
      layoutId: SCREEN_LAYOUTS[screenNumber],
      totalSeats,
      screenType,
    };
  });
};

const prepareTheatreData = (body) => {
  const data = { ...body };

  if (typeof data.screens === "string") {
    data.screens = JSON.parse(data.screens);
  }

  if (typeof data.amenities === "string") {
    data.amenities = JSON.parse(data.amenities);
  }

  // Only process screens when supplied.
  if (data.screens !== undefined) {
    data.screens = prepareScreens(data.screens);
  }

  if (data.name) {
    data.slug = createSlug(data.name);
  }

  if (data.status) {
    data.status = data.status.toLowerCase();
  }

  return data;
};

// CREATE THEATRE
exports.createTheatre = async (req, res, next) => {
  try {
    const theatreData = prepareTheatreData(req.body);

    const requiredFields = [
      "name",
      "address",
      "city",
      "state",
      "pincode",
      "screens",
    ];

    for (const field of requiredFields) {
      if (
        theatreData[field] === undefined ||
        theatreData[field] === null ||
        theatreData[field] === ""
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    const theatre = await theatreService.createTheatre(theatreData);

    res.status(201).json({
      success: true,
      message: "Theatre created successfully",
      data: theatre,
    });
  } catch (error) {
    if (
      error.message.includes("Screens") ||
      error.message.includes("Screen") ||
      error.message.includes("capacity") ||
      error.message.includes("technology")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// GET ALL THEATRES
exports.getTheatres = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status.toLowerCase();
    }

    if (req.query.city) {
      filters.city = new RegExp(
        `^${escapeRegex(req.query.city)}$`,
        "i"
      );
    }

    const theatres = await theatreService.getAllTheatres(filters);

    res.status(200).json({
      success: true,
      count: theatres.length,
      data: theatres,
    });
  } catch (error) {
    next(error);
  }
};

// GET THEATRE BY ID
exports.getTheatreById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
    }

    const theatre = await theatreService.getTheatreById(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      data: theatre,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE THEATRE
exports.updateTheatre = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
    }

    const theatreData = prepareTheatreData(req.body);

    const theatre = await theatreService.updateTheatre(
      req.params.id,
      theatreData
    );

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Theatre updated successfully",
      data: theatre,
    });
  } catch (error) {
    if (
      error.message.includes("Screens") ||
      error.message.includes("Screen") ||
      error.message.includes("capacity") ||
      error.message.includes("technology")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// DELETE THEATRE
exports.deleteTheatre = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid theatre ID",
      });
    }

    const theatre = await theatreService.deleteTheatre(req.params.id);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Theatre deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
