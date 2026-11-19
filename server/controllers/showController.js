
const mongoose = require("mongoose");
const Show = require("../models/Show");
const Movie = require("../models/Movie");
const Theatre = require("../models/Theatre");
const showService = require("../services/showService");

const INDIA_TIME_ZONE = "Asia/Kolkata";
const IST_OFFSET = "+05:30";
const TURNAROUND_MINUTES = 15;

// Validate 24-hour HH:mm time.
const validTime = (time) =>
  typeof time === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

// Get current date and time in India.
const getIndiaDateTime = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
};

// Extract YYYY-MM-DD without accidentally changing the calendar date.
const getDateOnly = (value) => {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return null;
};

// Validate an actual calendar date.
const isValidDateOnly = (dateString) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) {
    return false;
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateString
  );
};

// Convert Indian local date and time into a real UTC timestamp.
const dateAndTimeToIST = (dateString, timeString) =>
  new Date(`${dateString}T${timeString}:00${IST_OFFSET}`);

// Display timestamp as Indian local time.
const formatTimeInIST = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

// Prepare request data.
const prepareShowData = (body) => {
  const data = { ...body };

  if (typeof data.ticketPrices === "string") {
    try {
      data.ticketPrices = JSON.parse(data.ticketPrices);
    } catch {
      const error = new Error("Ticket prices must be valid JSON.");
      error.statusCode = 400;
      throw error;
    }
  }

  if (data.status) {
    data.status = String(data.status).toLowerCase();
  }

  return data;
};

// Validate movie, theatre and screen references.
const validateReferences = async (data) => {
  if (!mongoose.isValidObjectId(data.movie)) {
    return { error: "A valid movie is required." };
  }

  if (!mongoose.isValidObjectId(data.theatre)) {
    return { error: "A valid theatre is required." };
  }

  const [movie, theatre] = await Promise.all([
    Movie.findById(data.movie),
    Theatre.findById(data.theatre),
  ]);

  if (!movie) {
    return { error: "Movie not found." };
  }

  if (movie.status !== "published") {
    return { error: "Only published movies can be scheduled." };
  }

  if (!Number.isInteger(movie.duration) || movie.duration <= 0) {
    return { error: "The selected movie has an invalid runtime." };
  }

  if (!theatre) {
    return { error: "Theatre not found." };
  }

  if (theatre.status !== "active") {
    return {
      error: "Cannot schedule a show at an inactive theatre.",
    };
  }

  if (
    !data.screen?.screenId ||
    !mongoose.isValidObjectId(data.screen.screenId)
  ) {
    return { error: "A valid screen is required." };
  }

  const selectedScreen = theatre.screens.id(data.screen.screenId);

  if (!selectedScreen) {
    return {
      error: "Selected screen does not belong to this theatre.",
    };
  }

  if (!selectedScreen.isActive) {
    return { error: "Selected screen is inactive." };
  }

  if (data.format !== selectedScreen.screenType) {
    return {
      error: `Selected screen supports ${selectedScreen.screenType}, not ${data.format}.`,
    };
  }

  // Always use screen details from the database.
  data.screen = {
    screenId: selectedScreen._id,
    name: selectedScreen.name,
    screenType: selectedScreen.screenType,
  };

  return { movie, theatre, selectedScreen };
};

// Convert existing timestamp-based or legacy show records into intervals.
const getExistingShowInterval = (show) => {
  if (show.startAt && show.endAt) {
    const startAt = new Date(show.startAt);
    const endAt = new Date(show.endAt);

    if (
      !Number.isNaN(startAt.getTime()) &&
      !Number.isNaN(endAt.getTime()) &&
      endAt > startAt
    ) {
      return { startAt, endAt };
    }
  }

  // Compatibility with older show records.
  const dateString = getDateOnly(show.showDate);

  if (
    !isValidDateOnly(dateString) ||
    !validTime(show.startTime) ||
    !validTime(show.endTime)
  ) {
    return null;
  }

  const startAt = dateAndTimeToIST(dateString, show.startTime);
  let endAt = dateAndTimeToIST(dateString, show.endTime);

  // An end time earlier than start time means the show ends next day.
  if (endAt <= startAt) {
    endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
  }

  return { startAt, endAt };
};

// Validate date, calculate runtime-based end time and detect conflicts.
const validateSchedule = async (
  data,
  movie,
  excludedShowId = null
) => {
  const dateString = getDateOnly(data.showDate);

  if (!isValidDateOnly(dateString)) {
    return {
      error: "Please provide a valid show date in YYYY-MM-DD format.",
    };
  }

  if (!validTime(data.startTime)) {
    return {
      error: "Start time must use the 24-hour HH:mm format.",
    };
  }

  const { date: today } = getIndiaDateTime();

  if (dateString < today) {
    return {
      error: "Past dates cannot be scheduled. Select today or a future date.",
    };
  }

  const startAt = dateAndTimeToIST(dateString, data.startTime);

  if (Number.isNaN(startAt.getTime())) {
    return { error: "Invalid show start date or time." };
  }

  if (startAt.getTime() <= Date.now()) {
    return {
      error: "This start time has passed. Select a future time in IST.",
    };
  }

  // IMPORTANT: Movie runtime is read from MongoDB.
  // The frontend cannot override the calculated end time.
  const runtimeMinutes = movie.duration;

  const endAt = new Date(
    startAt.getTime() + runtimeMinutes * 60 * 1000
  );

  const turnaroundMinutes = TURNAROUND_MINUTES;

  // Search all non-cancelled shows on this screen.
  // Do not restrict by showDate because overnight shows can cross dates.
  const query = {
    theatre: data.theatre,
    "screen.screenId": data.screen.screenId,
    status: { $ne: "cancelled" },
  };

  if (excludedShowId) {
    query._id = { $ne: excludedShowId };
  }

  const existingShows = await Show.find(query).select(
    "_id showDate startTime endTime startAt endAt status"
  );

  const conflict = existingShows.some((existingShow) => {
    const interval = getExistingShowInterval(existingShow);

    if (!interval) {
      return false;
    }

    const existingEndWithBuffer = new Date(
      interval.endAt.getTime() + turnaroundMinutes * 60 * 1000
    );

    const newEndWithBuffer = new Date(
      endAt.getTime() + turnaroundMinutes * 60 * 1000
    );

    // Check both possible scheduling orders:
    // New show after existing show.
    // New show before existing show.
    return (
      startAt < existingEndWithBuffer &&
      newEndWithBuffer > interval.startAt
    );
  });

  if (conflict) {
    return {
      error: `Schedule conflict: this screen needs at least ${turnaroundMinutes} minutes between shows. Choose another time.`,
    };
  }

  return {
    startAt,
    endAt,
    runtimeMinutes,
    turnaroundMinutes,

    // Keep the existing fields for frontend compatibility.
    showDate: new Date(`${dateString}T00:00:00.000Z`),
    startTime: data.startTime,
    endTime: formatTimeInIST(endAt),
  };
};

// Standard validation response.
const sendValidationError = (res, message, status = 400) =>
  res.status(status).json({
    success: false,
    message,
  });

// CREATE SHOW
exports.createShow = async (req, res, next) => {
  try {
    const data = prepareShowData(req.body);

    const requiredFields = [
      "movie",
      "theatre",
      "screen",
      "showDate",
      "startTime",
      "language",
      "format",
      "ticketPrices",
    ];

    for (const field of requiredFields) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        return sendValidationError(
          res,
          `${field} is required.`
        );
      }
    }

    const referenceResult = await validateReferences(data);

    if (referenceResult.error) {
      return sendValidationError(res, referenceResult.error);
    }

    const scheduleResult = await validateSchedule(
      data,
      referenceResult.movie
    );

    if (scheduleResult.error) {
      return sendValidationError(
        res,
        scheduleResult.error,
        409
      );
    }

    const showData = {
      ...data,
      ...scheduleResult,
      status: data.status || "scheduled",
    };

    const show = await showService.createShow(showData);

    res.status(201).json({
      success: true,
      message: "Show created successfully.",
      data: show,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL SHOWS
exports.getShows = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status.toLowerCase();
    }

    if (
      req.query.movie &&
      mongoose.isValidObjectId(req.query.movie)
    ) {
      filters.movie = req.query.movie;
    }

    if (
      req.query.theatre &&
      mongoose.isValidObjectId(req.query.theatre)
    ) {
      filters.theatre = req.query.theatre;
    }

    const shows = await showService.getAllShows(filters);

    res.status(200).json({
      success: true,
      count: shows.length,
      data: shows,
    });
  } catch (error) {
    next(error);
  }
};

// GET SHOW BY ID
exports.getShowById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendValidationError(res, "Invalid show ID.");
    }

    const show = await showService.getShowById(req.params.id);

    if (!show) {
      return sendValidationError(res, "Show not found.", 404);
    }

    res.status(200).json({
      success: true,
      data: show,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE SHOW
exports.updateShow = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendValidationError(res, "Invalid show ID.");
    }

    const currentShow = await Show.findById(req.params.id);

    if (!currentShow) {
      return sendValidationError(res, "Show not found.", 404);
    }

    if (currentShow.status === "completed") {
      return sendValidationError(
        res,
        "Completed shows cannot be edited.",
        409
      );
    }

    const data = prepareShowData(req.body);

    const mergedData = {
      movie: data.movie ?? currentShow.movie,
      theatre: data.theatre ?? currentShow.theatre,

      screen: data.screen
        ? {
            ...(currentShow.screen?.toObject
              ? currentShow.screen.toObject()
              : currentShow.screen),
            ...data.screen,
          }
        : currentShow.screen?.toObject
          ? currentShow.screen.toObject()
          : currentShow.screen,

      showDate: data.showDate ?? currentShow.showDate,
      startTime: data.startTime ?? currentShow.startTime,
      language: data.language ?? currentShow.language,
      format: data.format ?? currentShow.format,

      ticketPrices: data.ticketPrices
        ? {
            ...(currentShow.ticketPrices?.toObject
              ? currentShow.ticketPrices.toObject()
              : currentShow.ticketPrices),
            ...data.ticketPrices,
          }
        : currentShow.ticketPrices?.toObject
          ? currentShow.ticketPrices.toObject()
          : currentShow.ticketPrices,

      status: data.status ?? currentShow.status,
    };

    if (!["scheduled", "cancelled"].includes(mergedData.status)) {
      return sendValidationError(res, "Invalid show status.");
    }

    // Cancellation releases the screen slot.
    if (mergedData.status === "cancelled") {
      const cancelledShow = await showService.updateShow(
        req.params.id,
        { status: "cancelled" }
      );

      return res.status(200).json({
        success: true,
        message: "Show cancelled successfully.",
        data: cancelledShow,
      });
    }

    const referenceResult = await validateReferences(mergedData);

    if (referenceResult.error) {
      return sendValidationError(res, referenceResult.error);
    }

    const scheduleResult = await validateSchedule(
      mergedData,
      referenceResult.movie,
      currentShow._id
    );

    if (scheduleResult.error) {
      return sendValidationError(
        res,
        scheduleResult.error,
        409
      );
    }

    const updatedShow = await showService.updateShow(
      req.params.id,
      {
        ...mergedData,
        ...scheduleResult,
        status: "scheduled",
      }
    );

    res.status(200).json({
      success: true,
      message: "Show updated successfully.",
      data: updatedShow,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE SHOW
exports.deleteShow = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return sendValidationError(res, "Invalid show ID.");
    }

    const show = await Show.findById(req.params.id);

    if (!show) {
      return sendValidationError(res, "Show not found.", 404);
    }

    if (show.status !== "cancelled") {
      return sendValidationError(
        res,
        "Cancel the show before deleting it.",
        409
      );
    }

    const deletedShow = await showService.deleteShow(req.params.id);

    res.status(200).json({
      success: true,
      message: "Show deleted successfully.",
      data: deletedShow,
    });
  } catch (error) {
    next(error);
  }
};
