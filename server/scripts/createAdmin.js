
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first."
      );
    }

    if (ADMIN_PASSWORD.length < 8) {
      throw new Error("Admin password must contain at least 8 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_EMAIL)) {
      throw new Error("Please provide a valid admin email address.");
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin") {
        console.log("An admin account with this email already exists.");
        return;
      }

      throw new Error(
        "This email already belongs to a customer. Use a different admin email. No account was changed."
      );
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
      isEmailVerified: false,
    });

    console.log("\nAdmin account created successfully!");
    console.log("Admin ID:", admin._id.toString());
    console.log("Admin email:", admin.email);
    console.log("Admin role:", admin.role);
    console.log("\nYou can now log in through the shared login API.");
  } catch (error) {
    console.error("\nAdmin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

createAdmin();
