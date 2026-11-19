const mongoose = require("mongoose");
const Show = require("../models/Show");
const seatService = require("../services/seatService");

// Generate seat inventory for a show.
exports.generateSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
      });
    }

    const inventory = await seatService.generateSeatsForShow(showId);

    return res.status(201).json({
      success: true,
      message: "Seat inventory generated successfully.",
      data: inventory,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Seat inventory already exists for this show.",
      });
    }

    if (
      error.message === "Show not found." ||
      error.message === "Theatre not found."
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.includes("already exists") ||
      error.message.includes("cancelled") ||
      error.message.includes("inactive") ||
      error.message.includes("does not match") ||
      error.message.includes("not found")
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// Retrieve customer-facing seat map with movie and theatre details.
exports.getSeats = async (req, res, next) => {
  try {
    const { showId } = req.params;

    if (!mongoose.isValidObjectId(showId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid show ID.",
      });
    }

    const show = await Show.findById(showId)
      .select(
        "_id movie theatre screen showDate startTime endTime format status",
      )
      .populate("movie", "title slug poster language duration rating")
      .populate("theatre", "name city state address");

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found.",
      });
    }

    const seats = await seatService.getSeatsForShow(showId);

    if (seats.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Seat inventory has not been generated for this show.",
        data: {
          showId,
          show,
          totalSeats: 0,
          rows: [],
          summary: {
            available: 0,
            locked: 0,
            booked: 0,
            blocked: 0,
          },
        },
      });
    }

    const rowMap = new Map();

    const categoryCounts = {
      regular: 0,
      premium: 0,
      recliner: 0,
      vip: 0,
    };

    const statusCounts = {
      available: 0,
      locked: 0,
      booked: 0,
      blocked: 0,
    };

    seats.forEach((seat) => {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, []);
      }

      rowMap.get(seat.row).push({
        id: seat._id,
        seatId: seat.seatId,
        seatLabel: seat.seatLabel,
        seatNumber: seat.seatNumber,
        columnNumber: seat.columnNumber,
        category: seat.category,
        price: seat.price,
        status: seat.status,
      });
      categoryCounts[seat.category] = (categoryCounts[seat.category] || 0) + 1;

      statusCounts[seat.status] = (statusCounts[seat.status] || 0) + 1;
    });

    const rows = Array.from(rowMap.entries()).map(([rowLabel, rowSeats]) => {
      rowSeats.sort((a, b) => a.columnNumber - b.columnNumber);

      const aisleAfter = [];

      for (let i = 1; i < rowSeats.length; i++) {
        if (rowSeats[i].columnNumber - rowSeats[i - 1].columnNumber > 1) {
          aisleAfter.push(rowSeats[i - 1].seatNumber);
        }
      }

      return {
        row: rowLabel,
        rowNumber: seats.find((seat) => seat.row === rowLabel).rowNumber,
        aisleAfter,
        seats: rowSeats,
      };
    });

    rows.sort((a, b) => a.rowNumber - b.rowNumber);

    return res.status(200).json({
      success: true,
      message: "Seat map retrieved successfully.",
      data: {
        show: {
          showId: show._id,
          movie: show.movie,
          theatre: show.theatre,
          screen: show.screen,
          showDate: show.showDate,
          startTime: show.startTime,
          endTime: show.endTime,
          format: show.format,
          status: show.status,
        },
        totalSeats: seats.length,
        totalRows: rows.length,
        categoryCounts,
        summary: statusCounts,
        rows,
      },
    });
  } catch (error) {
    next(error);
  }
};
