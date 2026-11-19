const path = require("path");

// Load environment variables
require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

// Core dependencies
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// API routes
const theatreRoutes = require("./routes/theatreRoutes");
const showRoutes = require("./routes/showRoutes");
const seatRoutes = require("./routes/seatRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const movieRoutes = require("./routes/movieRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded movie posters
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==========================================
// ROOT ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CineLockz API is running!",
  });
});

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/movies", movieRoutes);
app.use("/api/theatres", theatreRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(
    err.name === "MulterError" ? 400 : 500
  ).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(
        `CineLockz server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
};

startServer();