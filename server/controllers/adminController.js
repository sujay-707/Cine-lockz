const Movie = require("../models/Movie");
const Theatre = require("../models/Theatre");
const Show = require("../models/Show");
const Booking = require("../models/Booking");

// ==========================================
// ADMIN DASHBOARD
// ==========================================

const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalMovies,
      totalTheatres,
      scheduledShows,
      totalBookings,
      confirmedBookings,
      successfulPayments,
      bookingTrend,
    ] = await Promise.all([
      Movie.countDocuments(),

      Theatre.countDocuments(),

      Show.find({ status: "scheduled" })
        .select("startAt showDate startTime")
        .lean(),

      Booking.countDocuments(),

      Booking.countDocuments({
        bookingStatus: "confirmed",
      }),

      Booking.aggregate([
        {
          $match: {
            "payment.status": "success",
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: "$pricing.total",
            },
            paymentCount: {
              $sum: 1,
            },
          },
        },
      ]),

      Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                now.getTime() - 6 * 24 * 60 * 60 * 1000
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Kolkata",
              },
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]),
    ]);

    // Calculate upcoming scheduled shows.
    // Supports both startAt and legacy showDate + startTime.

    const activeShows = scheduledShows.filter((show) => {
      if (show.startAt) {
        return new Date(show.startAt) >= now;
      }

      if (!show.showDate || !show.startTime) {
        return false;
      }

      const date = new Date(show.showDate);

      const datePart = [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-");

      const legacyStart = new Date(
        `${datePart}T${show.startTime}:00+05:30`
      );

      return (
        !Number.isNaN(legacyStart.getTime()) &&
        legacyStart >= now
      );
    }).length;

    const revenue =
      successfulPayments[0]?.revenue || 0;

    const paymentCount =
      successfulPayments[0]?.paymentCount || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalMovies,
        totalTheatres,
        activeShows,
        totalBookings,
        confirmedBookings,
        successfulPayments: paymentCount,
        revenue,
        bookingTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL BOOKINGS (ADMIN)
// ==========================================

const getAllBookings = async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 20
      )
    );

    const skip = (page - 1) * limit;

    const filter = {};

    const allowedBookingStatuses = [
      "pending",
      "confirmed",
      "cancelled",
      "expired",
    ];

    const allowedPaymentStatuses = [
      "pending",
      "success",
      "failed",
      "refunded",
    ];

    if (
      allowedBookingStatuses.includes(
        req.query.bookingStatus
      )
    ) {
      filter.bookingStatus = req.query.bookingStatus;
    }

    if (
      allowedPaymentStatuses.includes(
        req.query.paymentStatus
      )
    ) {
      filter["payment.status"] =
        req.query.paymentStatus;
    }

    // Search booking ID, customer name, email or phone.

    if (
      req.query.search &&
      typeof req.query.search === "string"
    ) {
      const search = req.query.search
        .trim()
        .slice(0, 100);

      if (search) {
        const escaped = search.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filter.$or = [
          {
            bookingId: {
              $regex: escaped,
              $options: "i",
            },
          },
          {
            "customer.name": {
              $regex: escaped,
              $options: "i",
            },
          },
          {
            "customer.email": {
              $regex: escaped,
              $options: "i",
            },
          },
          {
            "customer.phone": {
              $regex: escaped,
              $options: "i",
            },
          },
        ];
      }
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("movie", "title poster language")
        .populate("theatre", "name city")
        .populate(
          "show",
          "showDate startTime endTime screen"
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getDashboard,
  getAllBookings,
};