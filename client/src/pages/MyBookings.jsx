import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import {
  CalendarDays, Clock, MapPin, Ticket, CreditCard, RefreshCw,
  AlertCircle, Film, Download, X, ShieldCheck,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./MyBookings.css";

import { API_BASE_URL } from "../utils/api";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  }) : "—";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount || 0);

const getTicketBookingId = (ticket) =>
  typeof ticket.booking === "object" ? ticket.booking?._id : ticket.booking;

export default function MyBookings() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchBookingsAndTickets = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const headers = { Authorization: `Bearer ${token}` };
      const [bookingResponse, ticketResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/customer/bookings`, { headers }),
        axios.get(`${API_BASE_URL}/customer/tickets`, { headers }),
      ]);
      setBookings(bookingResponse.data.data || []);
      setTickets(ticketResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your bookings and tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookingsAndTickets();
  }, [token]);

  useEffect(() => {
    if (!selectedBooking) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSelectedBooking(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBooking]);

  const ticketsByBooking = useMemo(() => {
    const grouped = {};
    tickets.forEach((ticket) => {
      const bookingId = getTicketBookingId(ticket);
      if (!bookingId) return;
      if (!grouped[bookingId]) grouped[bookingId] = [];
      grouped[bookingId].push(ticket);
    });
    return grouped;
  }, [tickets]);

  const selectedTickets = selectedBooking
    ? ticketsByBooking[selectedBooking._id] || []
    : [];

  const downloadTicket = async (ticketId) => {
    const element = document.getElementById(`ticket-${ticketId}`);
    if (!element) return;
    try {
      setDownloadingId(ticketId);
      const canvas = await html2canvas(element, {
        scale: 2, backgroundColor: "#18181C", useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `CineLockz-${ticketId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Ticket download failed:", err);
      window.alert("Unable to download ticket. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <Navbar />
      <main className="my-bookings-page">
        <div className="my-bookings-container">
          <div className="my-bookings-heading">
            <div>
              <span className="bookings-eyebrow">YOUR CINELOCKZ ACCOUNT</span>
              <h1>My Bookings</h1>
              <p>View your booking history and access your movie tickets.</p>
            </div>
            {!loading && (
              <div className="booking-count">
                <Ticket size={18} />
                {bookings.length} {bookings.length === 1 ? "Booking" : "Bookings"}
              </div>
            )}
          </div>

          {loading ? (
            <div className="bookings-state">
              <RefreshCw className="spin-icon" size={28} />
              <p>Loading your bookings...</p>
            </div>
          ) : error ? (
            <div className="bookings-state bookings-error">
              <AlertCircle size={28} />
              <p>{error}</p>
              <button onClick={fetchBookingsAndTickets}>Try Again</button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bookings-empty">
              <Film size={46} />
              <h2>No bookings yet</h2>
              <p>Your movie booking history will appear here once you book your first ticket.</p>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => {
                const movie = booking.movie;
                const theatre = booking.theatre;
                const show = booking.show;
                const bookingTickets = ticketsByBooking[booking._id] || [];
                const canViewTickets =
                  booking.bookingStatus === "confirmed" &&
                  booking.payment?.status === "success" &&
                  bookingTickets.length > 0;

                return (
                  <article className="booking-card" key={booking._id}>
                    <div className="booking-card-main">
                      <div className="booking-poster">
                        {movie?.poster ? <img src={movie.poster} alt={movie.title} /> : <Film size={38} />}
                      </div>
                      <div className="booking-information">
                        <div className="booking-title-row">
                          <div>
                            <h2>{movie?.title || "Movie"}</h2>
                            <span className="booking-language">{movie?.language || "—"}</span>
                          </div>
                          <span className={`booking-status booking-${booking.bookingStatus}`}>
                            {booking.bookingStatus}
                          </span>
                        </div>
                        <div className="booking-meta">
                          <div><MapPin size={16} /><span>{theatre?.name || "Theatre"}</span></div>
                          <div><CalendarDays size={16} /><span>{formatDate(show?.showDate)}</span></div>
                          <div><Clock size={16} /><span>{show?.startTime || "—"} – {show?.endTime || "—"}</span></div>
                        </div>
                        <div className="booking-seat-details">
                          <span>Screen: {show?.screen?.name || "—"}</span>
                          <span>Seats: {booking.seats?.map((seat) => seat.seatLabel).join(", ") || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="booking-card-footer">
                      <div className="booking-reference">
                        <span>BOOKING REFERENCE</span>
                        <strong>{booking.bookingId}</strong>
                      </div>
                      <div className="booking-payment">
                        <span>
                          <CreditCard size={15} />
                          {booking.payment?.method || "Payment"} · {booking.payment?.status || "Pending"}
                        </span>
                        <strong>{formatCurrency(booking.pricing?.total)}</strong>
                      </div>
                    </div>

                    {canViewTickets && (
                      <div className="booking-ticket-action">
                        <span><Ticket size={16} />{bookingTickets.length} {bookingTickets.length === 1 ? "ticket" : "tickets"} issued</span>
                        <button className="view-ticket-button" onClick={() => setSelectedBooking(booking)}>
                          <Ticket size={17} /> View Ticket{bookingTickets.length > 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedBooking && (
        <div
          className="booking-ticket-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedBooking(null);
          }}
        >
          <section className="booking-ticket-modal" role="dialog" aria-modal="true" aria-label="Your movie tickets">
            <div className="booking-ticket-modal-header">
              <div>
                <span className="bookings-eyebrow">CINELOCKZ E-TICKET</span>
                <h2>Your Ticket{selectedTickets.length > 1 ? "s" : ""}</h2>
                <p>{selectedBooking.movie?.title || "Your booking"}</p>
              </div>
              <button className="close-ticket-modal" onClick={() => setSelectedBooking(null)} aria-label="Close tickets">
                <X size={22} />
              </button>
            </div>

            {selectedTickets.length ? selectedTickets.map((ticket) => {
              const isValid = ticket.status === "valid";
              return (
                <article className="customer-ticket" key={ticket._id}>
                  <div className="ticket-download-area" id={`ticket-${ticket._id}`}>
                    <div className="ticket-top">
                      <div className="ticket-brand">
                        <Film size={22} />
                        <span>CINE<span>LOCKZ</span></span>
                      </div>
                      <span className={`ticket-status ${isValid ? "ticket-valid" : "ticket-invalid"}`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className="ticket-body">
                      <div className="ticket-movie">
                        <div className="ticket-poster">
                          {ticket.movie?.poster
                            ? <img src={ticket.movie.poster} alt={ticket.movie.title} crossOrigin="anonymous" />
                            : <Film size={40} />}
                        </div>
                        <div className="ticket-movie-info">
                          <h2>{ticket.movie?.title || "Movie"}</h2>
                          <p>{ticket.movie?.language || "—"}</p>
                          <div className="ticket-theatre">
                            <MapPin size={15} /><span>{ticket.theatre?.name || "Theatre"}</span>
                          </div>
                          <p className="ticket-address">
                            {ticket.theatre?.address || ""}
                            {ticket.theatre?.city ? `, ${ticket.theatre.city}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="ticket-details-grid">
                        <div><span>SHOW DATE</span><strong>{formatDate(ticket.show?.showDate)}</strong></div>
                        <div><span>SHOW TIME</span><strong>{ticket.show?.startTime || "—"} – {ticket.show?.endTime || "—"}</strong></div>
                        <div><span>SCREEN</span><strong>{ticket.show?.screen?.name || "—"}</strong></div>
                        <div><span>SEAT</span><strong>{ticket.seatLabel || "—"}</strong></div>
                        <div><span>CATEGORY</span><strong>{ticket.category || "—"}</strong></div>
                        <div><span>PRICE</span><strong>{formatCurrency(ticket.price)}</strong></div>
                      </div>

                      <div className="ticket-qr-section">
                        <div className="ticket-qr">
                          {ticket.qrCode
                            ? <QRCodeSVG value={ticket.qrCode} size={132} level="H" includeMargin />
                            : <span>QR unavailable</span>}
                        </div>
                        <div className="ticket-qr-info">
                          <ShieldCheck size={23} />
                          <h3>Entry Verification</h3>
                          <p>Present this QR code at the theatre entrance for ticket verification.</p>
                          <small>Each ticket has a unique verification code.</small>
                        </div>
                      </div>
                    </div>

                    <div className="ticket-footer">
                      <div><span>TICKET ID</span><strong>{ticket.ticketId}</strong></div>
                      <div>
                        <span>BOOKING ID</span>
                        <strong>{ticket.booking?.bookingId || selectedBooking.bookingId || "—"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-actions">
                    <span className="ticket-issued"><CalendarDays size={15} />Issued {formatDate(ticket.issuedAt)}</span>
                    <button
                      className="ticket-download-button"
                      onClick={() => downloadTicket(ticket._id)}
                      disabled={downloadingId === ticket._id}
                    >
                      {downloadingId === ticket._id
                        ? <RefreshCw size={17} className="tickets-spin" />
                        : <Download size={17} />}
                      {downloadingId === ticket._id ? "Downloading..." : "Download Ticket"}
                    </button>
                  </div>
                </article>
              );
            }) : <p className="no-booking-tickets">No issued tickets were found for this booking.</p>}
          </section>
        </div>
      )}

      <Footer />
    </>
  );
}
