
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import NotFound from "./pages/NotFound";
import SeatPreview from "./components/booking/SeatPreview";
import Payment from "./pages/Payment";
import Theatres from "./pages/Theatres";
import AboutUs from "./pages/AboutUs";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Customer pages
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";

// Authentication
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

// Admin components
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageMovies from "./pages/admin/ManageMovies";
import ManageTheatres from "./pages/admin/ManageTheatres";
import ManageShows from "./pages/admin/ManageShows";
import ManageBookings from "./pages/admin/ManageBookings";

import "./App.css";

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading CineLockz...</div>;
  }

  if (user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : "/"}
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication routes */}
        <Route
          path="/login"
          element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          }
        />

        <Route
          path="/signup"
          element={
            <AuthRedirect>
              <Signup />
            </AuthRedirect>
          }
        />

        {/* Public customer routes */}
        <Route path="/" element={<Home />} />
        <Route path="/movies/:slug" element={<MovieDetails />} />
        <Route path="/theatres" element={<Theatres />} />
        <Route path="/about-us" element={<AboutUs />} />

        {/* Booking routes — login and customer role required */}
        <Route
          path="/booking/:showId"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <SeatPreview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* Customer account routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="movies" element={<ManageMovies />} />
          <Route path="theatres" element={<ManageTheatres />} />
          <Route path="shows" element={<ManageShows />} />
          <Route path="bookings" element={<ManageBookings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
