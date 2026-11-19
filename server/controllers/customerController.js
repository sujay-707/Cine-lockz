const User = require("../models/User");
const Booking = require("../models/Booking");
const Ticket = require("../models/Ticket");

// GET /api/customer/profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email phone role isActive isEmailVerified profileImage createdAt",
    );

    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      user: req.user.id,
    })
      .populate("movie", "title poster language")
      .populate("theatre", "name city address")
      .populate("show", "showDate startTime endTime screen")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/customer/tickets
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({
      user: req.user.id,
    })
      .select("+qrCode")
      .populate("movie", "title poster language")
      .populate("theatre", "name city address")
      .populate("show", "showDate startTime endTime screen")
      .populate("booking", "bookingId bookingStatus payment pricing")
      .sort({ issuedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};
