
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  LockKeyhole,
  Download,
  Ticket,
  Play,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import "./Payment.css";

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString("en-IN");

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  const booking = location.state;

  const ticketRef = useRef(null);

  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [showSeatDemo, setShowSeatDemo] = useState(false);

  const [bookingReference] = useState(
    () => `CLZ${Date.now().toString().slice(-8)}`
  );

  if (!booking || !booking.selectedSeats?.length) {
    return (
      <main className="payment-page">
        <div className="payment-empty">
          <h2>No booking details found</h2>
          <p>Please select your seats before proceeding.</p>

          <button onClick={() => navigate("/")}>
            Browse Movies
          </button>
        </div>
      </main>
    );
  }

  const {
    movie,
    theatre,
    show,
    selectedSeats,
    totalPrice,
  } = booking;

  const convenienceFee = Math.round(totalPrice * 0.02);
  const finalAmount = totalPrice + convenienceFee;

  const seatLabels = selectedSeats
    .map((seat) => seat.seatLabel)
    .join(", ");

  const posterUrl = movie?.poster
    ? movie.poster.startsWith("http")
      ? movie.poster
      : `http://localhost:5000${movie.poster}`
    : "";

  console.log("Movie data:", movie);
  console.log("Poster value:", movie?.poster);
  console.log("Final poster URL:", posterUrl);
  // SIMULATED PAYMENT
  const handleDemoPayment = () => {
    if (processing || paid) return;

    setProcessing(true);

    // No actual payment gateway or money transfer.
    setTimeout(() => {
      const demoTransactionId =
        `CLZTXN${Date.now().toString().slice(-8)}`;

      setTransactionId(demoTransactionId);
      setProcessing(false);
      setPaid(true);
      setShowSeatDemo(true);
    }, 1800);
  };

  // DOWNLOAD TICKET AS PNG
  const handleDownloadTicket = async () => {
    if (!ticketRef.current || downloading) return;

    setDownloading(true);

    try {
      // Wait for ticket images to finish loading.
      const images = Array.from(
        ticketRef.current.querySelectorAll("img")
      );

      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        backgroundColor: "#FFFFFF",
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 15000,
      });

      const imageUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");

      link.href = imageUrl;
      link.download = `CineLockz-Ticket-${bookingReference}.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Ticket download error:", error);

      alert(
        "Unable to download the ticket. Please check the movie poster image and try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  // QR CODE DATA
  const qrTicketData = JSON.stringify({
    platform: "CINELOCKZ",
    bookingId: bookingReference,
    transactionId,
    movie: movie?.title,
    theatre: theatre?.name,
    screen: show?.screen?.name,
    showDate: show?.showDate,
    showTime: show?.startTime,
    seats: selectedSeats.map((seat) => seat.seatLabel),
    amount: finalAmount,
    ticketType: "DEMO",
  });

  return (
    <main className="payment-page">
      <div className="payment-container">

        {/* HEADER */}
        <header className="payment-header no-print">
          <button
            className="payment-back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Back to Seats
          </button>

          <div className="payment-brand">
            CINE<span>LOCKZ</span>
          </div>

          <div className="payment-secure">
            <LockKeyhole size={14} />
            Demo Checkout
          </div>
        </header>

        {/* PAYMENT SUCCESS */}
        {paid ? (
          <section className="payment-success">

            {/* SUCCESS HEADING */}
            <div className="success-icon no-print">
              <CheckCircle2 size={54} />
            </div>

            <span className="payment-eyebrow no-print">
              DEMO PAYMENT COMPLETED
            </span>

            <h1 className="no-print">
              Booking Confirmed!
            </h1>

            <p className="no-print">
              Your simulated payment was successful.
              No real money was charged.
            </p>

            {/* CINELockZ SEAT UNLOCKING VIDEO */}
            {showSeatDemo && (
              <div className="ticket-video-section">

                <div className="ticket-video-heading">
                  <span className="payment-eyebrow">
                    CINELOCKZ SMART TECHNOLOGY
                  </span>

                  <h2>
                    Experience Smart Seat Unlocking
                  </h2>

                  <p>
                    See how CineLockz uses QR ticket verification
                    to unlock your assigned cinema seat.
                  </p>
                </div>

                <video
                  className="ticket-demo-video"
                  autoPlay
                  muted
                  controls
                  playsInline
                  preload="auto"
                  onEnded={() => setShowSeatDemo(false)}
                  onError={() => setShowSeatDemo(false)}
                >
                  <source
                    src="/demovideo/demoscan.mp4"
                    type="video/mp4"
                  />

                  Your browser does not support video playback.
                </video>

                <div className="ticket-video-footer">
                  <span>
                    <Play size={15} />
                    10-second CineLockz demonstration
                  </span>

                  <button
                    type="button"
                    className="ticket-skip-video"
                    onClick={() => setShowSeatDemo(false)}
                  >
                    Skip Video & View Ticket
                  </button>
                </div>

              </div>
            )}

            {/* GENERATED CINEMA TICKET */}
            {!showSeatDemo && (
              <>
                <div
                  className="cinelockz-ticket"
                  ref={ticketRef}
                >

                  {/* TICKET HEADER */}
                  <div className="cinelockz-ticket-header">
                    <div className="cinelockz-ticket-brand">
                      <span className="ticket-brand-main">
                        CINE
                      </span>

                      <span className="ticket-brand-accent">
                        LOCKZ
                      </span>
                    </div>

                    <div className="ticket-confirmed">
                      <CheckCircle2 size={16} />
                      BOOKING CONFIRMED
                    </div>
                  </div>

                  {/* MOVIE POSTER */}
                  <div className="cinelockz-ticket-poster">
                    {posterUrl ? (

                      <img
                        src={posterUrl}
                        alt={`${movie?.title || "Movie"} poster`}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="ticket-poster-placeholder">
                        <Ticket size={42} />
                        <span>{movie?.title}</span>
                      </div>
                    )}
                  </div>

                  {/* MOVIE TITLE */}
                  <div className="cinelockz-ticket-movie">
                    <h2>{movie?.title || "Movie"}</h2>

                    <div className="ticket-movie-tags">
                      {movie?.language && (
                        <span>{movie.language}</span>
                      )}

                      {show?.format && (
                        <span>{show.format}</span>
                      )}

                      <span>DEMO TICKET</span>
                    </div>
                  </div>

                  {/* CINEMA DETAILS */}
                  <div className="cinelockz-ticket-details">

                    <div className="ticket-detail-block">
                      <span>CINEMA</span>

                      <strong>
                        {theatre?.name || "CineLockz Cinema"}
                      </strong>

                      <small>
                        {theatre?.city || "Bengaluru"}
                      </small>

                      <small>
                        {show?.screen?.name || "Screen"}
                      </small>
                    </div>

                    <div className="ticket-detail-divider" />

                    <div className="ticket-detail-block">
                      <span>DATE & TIME</span>

                      <strong>
                        {formatDate(show?.showDate)}
                      </strong>

                      <small>
                        {show?.startTime || "Time unavailable"}
                      </small>
                    </div>

                    <div className="ticket-detail-divider" />

                    <div className="ticket-detail-block">
                      <span>SEATS</span>

                      <strong>{seatLabels}</strong>

                      <small>
                        {selectedSeats.length}{" "}
                        {selectedSeats.length === 1
                          ? "Ticket"
                          : "Tickets"}
                      </small>
                    </div>
                  </div>

                  {/* EXPERIENCE */}
                  <div className="ticket-experience">
                    {show?.format || "CineLockz Cinema Experience"}
                  </div>

                  {/* BOOKING ID */}
                  <div className="cinelockz-ticket-booking">
                    <span>BOOKING ID</span>

                    <strong>{bookingReference}</strong>

                    <small>
                      TRANS ID: {transactionId}
                    </small>
                  </div>

                  {/* QR CODE */}
                  <div className="cinelockz-ticket-qr">

                    <div className="ticket-qr-code">
                      <QRCodeSVG
                        value={qrTicketData}
                        size={170}
                        level="H"
                        includeMargin
                      />
                    </div>

                    <div className="ticket-qr-instructions">
                      <strong>
                        SCAN AT THE KIOSK / ENTRANCE
                      </strong>

                      <span>
                        Your demo ticket reference
                      </span>

                      <small>
                        QR code for demonstration only.
                      </small>
                    </div>
                  </div>

                  {/* AMOUNT AND BOOKING DATE */}
                  <div className="cinelockz-ticket-footer">

                    <div>
                      <span>TOTAL AMOUNT</span>

                      <strong>
                        ₹{formatAmount(finalAmount)}
                      </strong>
                    </div>

                    <div>
                      <span>BOOKING DATE</span>

                      <strong>
                        {formatDate(new Date())}
                      </strong>
                    </div>
                  </div>

                  {/* DEMO DISCLAIMER */}
                  <div className="ticket-demo-warning">
                    DEMO TICKET · NOT VALID FOR REAL CINEMA ENTRY
                  </div>
                </div>

                {/* DOWNLOAD ACTION */}
                <div className="ticket-actions no-print">

                  <button
                    className="payment-primary-button"
                    onClick={handleDownloadTicket}
                    disabled={downloading}
                  >
                    <Download size={18} />

                    {downloading
                      ? "Generating Ticket Image..."
                      : "Download Ticket PNG"}
                  </button>

                  <button
                    className="ticket-home-button"
                    onClick={() => navigate("/")}
                  >
                    Back to Home
                  </button>
                </div>

                <p className="ticket-demo-note no-print">
                  Your CineLockz ticket will be downloaded
                  as a high-resolution PNG image.
                </p>
              </>
            )}

          </section>
        ) : (

          /* PAYMENT CHECKOUT */
          <>
            <div className="payment-title">
              <span className="payment-eyebrow">
                SECURE CHECKOUT EXPERIENCE
              </span>

              <h1>Complete Your Payment</h1>

              <p>
                Review your booking and choose a demo payment method.
              </p>
            </div>

            <div className="payment-layout">

              {/* PAYMENT METHODS */}
              <section className="payment-method-card">

                <div className="payment-section-heading">
                  <h2>Payment Method</h2>
                  <ShieldCheck size={20} />
                </div>

                <div className="payment-demo-warning">
                  <ShieldCheck size={18} />

                  <span>
                    Demo payment environment.
                    No actual payment will occur.
                  </span>
                </div>

                <div className="payment-method-list">

                  <button
                    className={`payment-method ${method === "upi" ? "active" : ""
                      }`}
                    onClick={() => setMethod("upi")}
                  >
                    <Smartphone />

                    <span>
                      <strong>UPI</strong>
                      <small>
                        Google Pay · PhonePe · BHIM
                      </small>
                    </span>

                    <span className="payment-radio" />
                  </button>

                  <button
                    className={`payment-method ${method === "card" ? "active" : ""
                      }`}
                    onClick={() => setMethod("card")}
                  >
                    <CreditCard />

                    <span>
                      <strong>Credit / Debit Card</strong>
                      <small>
                        Visa · Mastercard · RuPay
                      </small>
                    </span>

                    <span className="payment-radio" />
                  </button>

                  <button
                    className={`payment-method ${method === "netbanking" ? "active" : ""
                      }`}
                    onClick={() => setMethod("netbanking")}
                  >
                    <Building2 />

                    <span>
                      <strong>Net Banking</strong>
                      <small>
                        All major Indian banks
                      </small>
                    </span>

                    <span className="payment-radio" />
                  </button>

                  <button
                    className={`payment-method ${method === "wallet" ? "active" : ""
                      }`}
                    onClick={() => setMethod("wallet")}
                  >
                    <Wallet />

                    <span>
                      <strong>Wallet</strong>
                      <small>Demo wallet checkout</small>
                    </span>

                    <span className="payment-radio" />
                  </button>
                </div>

                {/* SELECTED PAYMENT METHOD */}
                <div className="payment-method-info">

                  {method === "upi" && (
                    <>
                      <h3>UPI Payment</h3>

                      <div className="demo-upi-box">
                        <Smartphone size={24} />

                        <div>
                          <strong>Demo UPI Checkout</strong>
                          <span>demo@cinelockz</span>
                        </div>
                      </div>
                    </>
                  )}

                  {method === "card" && (
                    <>
                      <h3>Card Payment</h3>

                      <div className="demo-card-box">
                        <CreditCard size={24} />

                        <div>
                          <strong>DEMO CARD</strong>
                          <span>•••• •••• •••• 4242</span>
                          <small>Test interface only</small>
                        </div>
                      </div>
                    </>
                  )}

                  {method === "netbanking" && (
                    <>
                      <h3>Net Banking</h3>

                      <div className="demo-upi-box">
                        <Building2 size={24} />

                        <div>
                          <strong>Demo Bank Gateway</strong>
                          <span>
                            Choose simulated bank checkout
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {method === "wallet" && (
                    <>
                      <h3>Wallet Payment</h3>

                      <div className="demo-upi-box">
                        <Wallet size={24} />

                        <div>
                          <strong>Demo Wallet</strong>
                          <span>
                            Simulated wallet payment
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* PAY BUTTON */}
                <button
                  className="payment-primary-button"
                  disabled={processing}
                  onClick={handleDemoPayment}
                >
                  {processing
                    ? "Processing Demo Payment..."
                    : `Pay ₹${formatAmount(finalAmount)}`}
                </button>

                <p className="payment-disclaimer">
                  This is a simulated transaction. Never enter
                  real card details, UPI PINs or banking credentials.
                </p>
              </section>

              {/* BOOKING SUMMARY */}
              <aside className="payment-order-card">

                <h2>Booking Summary</h2>

                <div className="payment-movie">
                  {posterUrl && (
                    <img
                      src={posterUrl}
                      alt={movie?.title}
                    />
                  )}

                  <div>
                    <h3>{movie?.title}</h3>
                    <span>{movie?.language}</span>
                    <span>{theatre?.name}</span>
                  </div>
                </div>

                <div className="payment-order-detail">
                  <span>Show date</span>
                  <strong>{formatDate(show?.showDate)}</strong>
                </div>

                <div className="payment-order-detail">
                  <span>Showtime</span>
                  <strong>{show?.startTime}</strong>
                </div>

                <div className="payment-order-detail">
                  <span>Screen</span>
                  <strong>{show?.screen?.name}</strong>
                </div>

                <div className="payment-order-detail">
                  <span>Selected seats</span>
                  <strong>{seatLabels}</strong>
                </div>

                <div className="payment-order-detail">
                  <span>Ticket count</span>
                  <strong>{selectedSeats.length}</strong>
                </div>

                <div className="payment-price-breakdown">

                  <div>
                    <span>Ticket subtotal</span>
                    <strong>
                      ₹{formatAmount(totalPrice)}
                    </strong>
                  </div>

                  <div>
                    <span>Convenience fee (demo)</span>
                    <strong>
                      ₹{formatAmount(convenienceFee)}
                    </strong>
                  </div>

                  <div className="payment-grand-total">
                    <span>Total payable</span>
                    <strong>
                      ₹{formatAmount(finalAmount)}
                    </strong>
                  </div>
                </div>

                <div className="payment-trust">
                  <ShieldCheck size={17} />
                  <span>Simulated secure checkout</span>
                </div>
              </aside>
            </div>
          </>
        )}

      </div>
    </main>
  );
}
