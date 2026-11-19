
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Ticket,
  IndianRupee,
  CheckCircle,
  Clock,
} from "lucide-react";
import "../../styles/admin/ManageBookings.css";

import { API_BASE_URL } from "../../utils/api";

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  const [search, setSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("cinelockz_token");

      if (!token) {
        throw new Error("Admin authentication token not found. Please log in again.");
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
        bookingStatus,
        paymentStatus,
      });

      const response = await fetch(
        `${API_BASE_URL}/admin/bookings?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load bookings.");
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to retrieve bookings.");
      }

      setBookings(Array.isArray(result.data) ? result.data : []);
      setPagination(
        result.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 1,
        }
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [search, bookingStatus, paymentStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const handleRefresh = () => {
    fetchBookings(pagination.page);
  };

  const getPaymentStatus = (booking) => {
    return booking.payment?.status || "pending";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (booking) => {
    const amount = booking.pricing?.total;

    if (amount === undefined || amount === null) return "—";

    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const getSeats = (booking) => {
    if (!Array.isArray(booking.seats) || booking.seats.length === 0) {
      return "—";
    }

    return booking.seats
      .map((seat) => {
        if (typeof seat === "string") return seat;
        return seat.seatNumber || seat.seatId || "—";
      })
      .join(", ");
  };

  const getBookingStatusClass = (status) => {
    const normalized = String(status || "pending").toLowerCase();

    if (normalized === "confirmed") return "confirmed";
    if (normalized === "cancelled") return "cancelled";
    if (normalized === "completed") return "completed";

    return "pending";
  };

  const getPaymentStatusClass = (status) => {
    const normalized = String(status || "pending").toLowerCase();

    if (normalized === "success") return "success";
    if (normalized === "failed") return "failed";

    return "pending";
  };

  return (
    <div className="manage-bookings-page">
      <div className="bookings-heading">
        <div>
          <h2>Manage Bookings</h2>
          <p>View and monitor customer reservations and payments.</p>
        </div>

        <button
          type="button"
          className="bookings-refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="bookings-summary">
        <div className="bookings-summary-card">
          <div className="bookings-summary-icon">
            <Ticket size={21} />
          </div>
          <div>
            <span>Total Bookings</span>
            <strong>{pagination.total}</strong>
          </div>
        </div>

        <div className="bookings-summary-card">
          <div className="bookings-summary-icon">
            <CheckCircle size={21} />
          </div>
          <div>
            <span>Confirmed Bookings</span>
            <strong>
              {bookings.filter(
                (booking) => booking.bookingStatus === "confirmed"
              ).length}
            </strong>
          </div>
        </div>

        <div className="bookings-summary-card">
          <div className="bookings-summary-icon">
            <IndianRupee size={21} />
          </div>
          <div>
            <span>Successful Payments</span>
            <strong>
              {bookings.filter(
                (booking) => getPaymentStatus(booking) === "success"
              ).length}
            </strong>
          </div>
        </div>

        <div className="bookings-summary-card">
          <div className="bookings-summary-icon">
            <Clock size={21} />
          </div>
          <div>
            <span>Pending Bookings</span>
            <strong>
              {bookings.filter(
                (booking) => booking.bookingStatus === "pending"
              ).length}
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="bookings-error">
          {error}
        </div>
      )}

      <div className="bookings-table-panel">
        <div className="bookings-toolbar">
          <label className="bookings-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Search booking, customer, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="bookings-filters">
            <select
              value={bookingStatus}
              onChange={(event) => setBookingStatus(event.target.value)}
              aria-label="Filter by booking status"
            >
              <option value="">All Booking Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              aria-label="Filter by payment status"
            >
              <option value="">All Payment Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bookings-loading">
            <RefreshCw size={25} />
            <span>Loading bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bookings-empty">
            <Ticket size={35} />
            <h3>No bookings found</h3>
            <p>Bookings matching your search will appear here.</p>
          </div>
        ) : (
          <>
            <div className="bookings-table-scroll">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Movie</th>
                    <th>Theatre</th>
                    <th>Show Date</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Booking Status</th>
                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <span className="booking-id">
                          {booking.bookingId || "—"}
                        </span>
                      </td>

                      <td>
                        <div className="booking-customer">
                          <strong>
                            {booking.customer?.name || "—"}
                          </strong>
                          <span>
                            {booking.customer?.email || "—"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="booking-movie">
                          {booking.movie?.poster && (
                            <img
                              src={booking.movie.poster}
                              alt={booking.movie.title || "Movie poster"}
                            />
                          )}
                          <strong>
                            {booking.movie?.title || "—"}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {booking.theatre?.name || "—"}
                      </td>

                      <td>
                        {formatDate(
                          booking.show?.showDate ||
                          booking.show?.startAt
                        )}
                        {booking.show?.startTime && (
                          <div>{booking.show.startTime}</div>
                        )}
                      </td>

                      <td>{getSeats(booking)}</td>

                      <td>
                        <span className="booking-amount">
                          {formatAmount(booking)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`booking-status ${getBookingStatusClass(
                            booking.bookingStatus
                          )}`}
                        >
                          {booking.bookingStatus || "Pending"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`payment-status ${getPaymentStatusClass(
                            getPaymentStatus(booking)
                          )}`}
                        >
                          {getPaymentStatus(booking)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bookings-pagination">
              <p>
                Showing {bookings.length} of {pagination.total} bookings
              </p>

              <div className="bookings-pagination-actions">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => fetchBookings(pagination.page - 1)}
                >
                  <ChevronLeft size={17} />
                </button>

                <button type="button" className="active" disabled>
                  {pagination.page}
                </button>

                <button
                  type="button"
                  aria-label="Next page"
                  disabled={
                    pagination.page >= pagination.pages || loading
                  }
                  onClick={() => fetchBookings(pagination.page + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ManageBookings;
