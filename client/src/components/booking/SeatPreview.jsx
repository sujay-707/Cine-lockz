

import { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import axios from "axios";
import { useAuth } from "../../context/AuthContext";



import CinemaSeat from "./CinemaSeat";

import Navbar from "../Navbar";

import Footer from "../Footer";



import "./SeatPreview.css";



const API_BASE_URL = "http://localhost:5000/api";



const CATEGORY_ORDER = ["recliner", "premium", "regular"];



const SEAT_LEGEND = [

  { color: "#10B981", label: "Available" },

  { color: "#EAB308", label: "Selected" },

  { color: "#EF4444", label: "Locked" },

  { color: "#55555D", label: "Booked" },

];



// Convert backend poster path into a complete image URL.

const getPosterUrl = (poster) => {

  if (!poster || typeof poster !== "string") return "";



  if (/^https?:\/\//i.test(poster)) {

    return poster;

  }



  return `http://localhost:5000${

    poster.startsWith("/") ? poster : `/${poster}`

  }`;

};



// Format show date.

const formatDate = (date) => {

  if (!date) return "";



  return new Date(date).toLocaleDateString("en-IN", {

    day: "numeric",

    month: "short",

    year: "numeric",

  });

};



// Format movie duration.

const formatDuration = (minutes) => {

  if (!minutes || minutes < 1) return "";



  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;



  return [

    hours > 0 ? `${hours}h` : "",

    remainingMinutes > 0 ? `${remainingMinutes}m` : "",

  ]

    .filter(Boolean)

    .join(" ");

};



function SeatPreview() {

  const { showId } = useParams();

  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [lockingSeats, setLockingSeats] = useState(false);
  const [lockError, setLockError] = useState("");



  const [seatMap, setSeatMap] = useState(null);

  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  // Fetch seat inventory and show information.

  useEffect(() => {

    const controller = new AbortController();



    const fetchSeats = async () => {

      try {

        setLoading(true);

        setError("");

        setSeatMap(null);

        setSelectedSeats([]);



        if (!showId) {

          throw new Error("Show ID is missing from the booking URL.");

        }



        const response = await axios.get(

          `${API_BASE_URL}/seats/${showId}`,

          {

            signal: controller.signal,

          }

        );



        if (!response.data?.success) {

          throw new Error(

            response.data?.message ||

              "Unable to retrieve the seat map."

          );

        }



        const seatData =

          response.data?.data?.data ?? response.data?.data;



        if (!seatData?.show) {

          throw new Error(

            "Show information is missing from the API response."

          );

        }



        console.log("Booking API response:", seatData);

        console.log("Movie returned by API:", seatData.show.movie);



        setSeatMap(seatData);

      } catch (err) {

        if (

          err.code === "ERR_CANCELED" ||

          err.name === "CanceledError"

        ) {

          return;

        }



        console.error("Seat loading error:", err);



        setError(

          err.response?.data?.message ||

            err.message ||

            "Could not connect to the server."

        );

      } finally {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      }

    };



    fetchSeats();



    return () => controller.abort();

  }, [showId]);



  const rows = seatMap?.rows || [];



  // Extract populated movie and theatre information.

  const show = seatMap?.show;



  const movie =

    show?.movie && typeof show.movie === "object"

      ? show.movie

      : null;



  const theatre =

    show?.theatre && typeof show.theatre === "object"

      ? show.theatre

      : null;



  const posterUrl = getPosterUrl(movie?.poster);



  // Build category sections using backend seat categories.

  const categorySections = useMemo(() => {

    const grouped = {};



    rows.forEach((row) => {

      row.seats.forEach((seat) => {

        const category = seat.category;



        if (!grouped[category]) {

          grouped[category] = [];

        }



        if (

          !grouped[category].some(

            (existingRow) => existingRow.row === row.row

          )

        ) {

          grouped[category].push(row);

        }

      });

    });



    return CATEGORY_ORDER

      .filter((category) => grouped[category]?.length)

      .map((category) => {

        const sectionRows = grouped[category].sort(

          (a, b) => b.rowNumber - a.rowNumber

        );



        const categorySeats = sectionRows.flatMap((row) =>

          row.seats.filter(

            (seat) => seat.category === category

          )

        );



        return {

          category,

          title:

            category.charAt(0).toUpperCase() +

            category.slice(1),

          price: categorySeats[0]?.price ?? 0,

          totalSeats: categorySeats.length,

          rows: sectionRows,

        };

      });

  }, [rows]);



  // Selected seat information.

  const selectedSeatDetails = useMemo(() => {

    return rows.flatMap((row) =>

      row.seats.filter((seat) =>

        selectedSeats.includes(seat.seatId)

      )

    );

  }, [rows, selectedSeats]);



  const totalPrice = selectedSeatDetails.reduce(

    (total, seat) => total + seat.price,

    0

  );



  // Select or deselect a seat.

  const toggleSeat = (seat) => {

    if (seat.status !== "available") return;



    setSelectedSeats((previous) =>

      previous.includes(seat.seatId)

        ? previous.filter((id) => id !== seat.seatId)

        : [...previous, seat.seatId]

    );

  };



  // Lock selected seats before continuing to payment.
  const handleContinueToPayment = async () => {
    if (lockingSeats || !selectedSeatDetails.length) return;

    if (!isAuthenticated || !token) {
      navigate("/login", { state: { from: `/booking/${showId}` } });
      return;
    }

    try {
      setLockingSeats(true);
      setLockError("");

      // The backend requires MongoDB seat document IDs.
      const seatIds = selectedSeatDetails.map((seat) => seat.id || seat._id);

      if (seatIds.some((id) => !id)) {
        throw new Error("Seat information is incomplete. Please reload the seat layout.");
      }

      const response = await axios.post(
        `${API_BASE_URL}/seats/${showId}/lock`,
        { seatIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to reserve selected seats.");
      }

      const lockData = response.data?.data?.data ?? response.data?.data;
      if (!lockData?.lockToken) {
        throw new Error("The server did not return a seat lock token.");
      }

      navigate("/payment", {
        state: {
          showId,
          movie,
          theatre,
          show,
          selectedSeats: selectedSeatDetails,
          totalPrice: lockData.totalPrice ?? totalPrice,
          lockToken: lockData.lockToken,
          lockExpiresAt: lockData.expiresAt,
        },
      });
    } catch (err) {
      console.error("Seat locking error:", err);
      setLockError(
        err.response?.data?.message || err.message ||
        "Unable to reserve seats. Please try again."
      );
    } finally {
      setLockingSeats(false);
    }
  };



  // Common page wrapper for all page states.

  const PageLayout = ({ children }) => (

    <div className="app-shell seat-preview-shell">

      <Navbar />

      <main className="seat-preview-page">

        {children}

      </main>

      <Footer />

    </div>

  );



  // Loading state.

  if (loading) {

    return (

      <PageLayout>

        <div className="seat-preview-message">

          <div className="seat-preview-loader" />

          <h2>Loading seat layout</h2>

          <p>Fetching available seats for your show...</p>

        </div>

      </PageLayout>

    );

  }



  // Error state.

  if (error) {

    return (

      <PageLayout>

        <div className="seat-preview-message">

          <h2 className="seat-error-title">

            Unable to load seats

          </h2>



          <p>{error}</p>



          <button

            className="seat-retry-button"

            onClick={() => window.location.reload()}

          >

            Retry

          </button>

        </div>

      </PageLayout>

    );

  }



  // Empty inventory state.

  if (!seatMap || seatMap.totalSeats === 0) {

    return (

      <PageLayout>

        <div className="seat-preview-message">

          <h2>No seats available</h2>



          <p>

            Seat inventory has not been generated for this show.

          </p>

        </div>

      </PageLayout>

    );

  }



  const summary = seatMap.summary || {};

  const categoryCounts = seatMap.categoryCounts || {};



  return (

    <PageLayout>

      {/* Movie Information */}

      <section className="booking-movie-card">

        {posterUrl ? (

          <img

            className="booking-movie-poster"

            src={posterUrl}

            alt={`${movie?.title || "Movie"} poster`}

            onError={(event) => {

              event.currentTarget.style.display = "none";

            }}

          />

        ) : (

          <div className="booking-movie-poster booking-movie-poster--empty">

            CINELOCKZ

          </div>

        )}



        <div className="booking-movie-details">

          <span className="seat-eyebrow">

            YOUR MOVIE

          </span>



          <h1>

            {movie?.title || "Movie information unavailable"}

          </h1>



          <div className="booking-movie-meta">

            {movie?.language && (

              <span>{movie.language}</span>

            )}



            {movie?.duration > 0 && (

              <span>{formatDuration(movie.duration)}</span>

            )}



            {movie?.rating > 0 && (

              <span>★ {movie.rating}/10</span>

            )}



            {Array.isArray(movie?.genre) &&

              movie.genre.length > 0 && (

                <span>

                  {movie.genre

                    .filter(

                      (genre) =>

                        genre.toLowerCase() !== "tbd"

                    )

                    .join(" / ")}

                </span>

              )}

          </div>



          <div className="booking-theatre-details">

            <strong>

              {theatre?.name || "CineLockz Grand Cinemas"}

            </strong>



            <span>

              {[theatre?.city, theatre?.state]

                .filter(Boolean)

                .join(", ")}

            </span>

          </div>



          <div className="booking-show-details">

            <span>{show?.screen?.name}</span>

            <span>{show?.format}</span>

            <span>{formatDate(show?.showDate)}</span>

            <span>

              {show?.startTime} – {show?.endTime}

            </span>

          </div>

        </div>

      </section>



      {/* Page Header */}

      <header className="seat-preview-header">

        <div>

          <span className="seat-eyebrow">

            CINELOCKZ EXPERIENCE

          </span>



          <h2>Select Your Seats</h2>



          <p>

            Choose your preferred seats for the best viewing

            experience.

          </p>

        </div>



        <div className="seat-show-info">

          <span>{show?.screen?.name}</span>

          <span>{show?.format}</span>

          <span>

            {show?.startTime} – {show?.endTime}

          </span>

          <span>{formatDate(show?.showDate)}</span>

        </div>

      </header>



      {/* Main Seat Layout */}

      <section className="seat-layout-card">

        <div className="seat-layout-heading">

          <div>

            <h2>Choose Your Seats</h2>

            <p>

              {seatMap.totalRows} rows · {seatMap.totalSeats} seats

            </p>

          </div>



          <span className="seat-technology">

            {show?.format}

          </span>

        </div>



        {/* Category Sections */}

        <div className="seat-map-scroll">

          <div className="seat-sections">

            {categorySections.map((section) => (

              <section

                className={`seat-section seat-section--${section.category}`}

                key={section.category}

              >

                <div className="seat-section-heading">

                  <div>

                    <h3>{section.title}</h3>



                    <span>

                      {section.rows.length} rows ·{" "}

                      {section.totalSeats} seats

                    </span>

                  </div>



                  <strong>

                    ₹{section.price.toLocaleString("en-IN")}

                    <small> / seat</small>

                  </strong>

                </div>



                <div className="seat-section-divider" />



                <div className="seat-section-rows">

                  {section.rows.map((row) => {

                    const categorySeats = row.seats.filter(

                      (seat) =>

                        seat.category === section.category

                    );



                    if (!categorySeats.length) return null;



                    const maxColumn = Math.max(

                      ...categorySeats.map(

                        (seat) => seat.columnNumber

                      )

                    );



                    return (

                      <div

                        className="seat-row"

                        key={`${section.category}-${row.row}`}

                      >

                        <span className="row-label">

                          {row.row}

                        </span>



                        <div

                          className="seat-grid"

                          style={{

                            gridTemplateColumns: `repeat(${maxColumn}, 34px)`,

                          }}

                        >

                          {categorySeats.map((seat) => {

                            const isSelected =

                              selectedSeats.includes(seat.seatId);



                            const displayStatus =

                              seat.status === "blocked"

                                ? "booked"

                                : seat.status;



                            return (

                              <div

                                className="seat-cell"

                                key={seat.seatId}

                                style={{

                                  gridColumn: seat.columnNumber,

                                }}

                              >

                                <CinemaSeat

                                  seat={{

                                    ...seat,

                                    label: seat.seatLabel,

                                  }}

                                  status={displayStatus}

                                  selected={isSelected}

                                  disabled={

                                    seat.status !== "available"

                                  }

                                  onClick={toggleSeat}

                                  size={30}

                                />



                                <span className="seat-number">

                                  {seat.seatNumber}

                                </span>

                              </div>

                            );

                          })}

                        </div>



                        <span className="row-label">

                          {row.row}

                        </span>

                      </div>

                    );

                  })}

                </div>

              </section>

            ))}

          </div>

        </div>



        {/* Cinema Screen */}

        <div className="cinema-screen-area">

          <div className="cinema-screen-glow" />

          <div className="cinema-screen-line" />

          <span>SCREEN</span>

          <small>THIS WAY TO THE SCREEN</small>

        </div>



        {/* Seat Legend */}

        <div className="seat-legend">

          {SEAT_LEGEND.map((item) => (

            <div className="seat-legend-item" key={item.label}>

              <span

                className="seat-legend-color"

                style={{ background: item.color }}

              />

              <span>{item.label}</span>

            </div>

          ))}

        </div>



        {/* Category Summary */}

        <div className="seat-category-summary">

          <div>

            <span>Regular</span>

            <strong>{categoryCounts.regular ?? 0}</strong>

          </div>



          <div>

            <span>Premium</span>

            <strong>{categoryCounts.premium ?? 0}</strong>

          </div>



          <div>

            <span>Recliner</span>

            <strong>{categoryCounts.recliner ?? 0}</strong>

          </div>

        </div>



        {/* Availability */}

        <div className="seat-availability">

          <span>

            Available <strong>{summary.available ?? 0}</strong>

          </span>



          <span>

            Locked <strong>{summary.locked ?? 0}</strong>

          </span>



          <span>

            Booked <strong>{summary.booked ?? 0}</strong>

          </span>

        </div>



        {/* Booking Summary */}

        <div className="seat-selection-summary">

          <div className="seat-selection-details">

            <h3>Booking Summary</h3>



            <p>

              {selectedSeatDetails.length

                ? selectedSeatDetails

                    .map((seat) => seat.seatLabel)

                    .join(", ")

                : "No seats selected"}

            </p>



            <span>

              {selectedSeats.length} seat(s) selected

            </span>

          </div>



          <div className="seat-total-price">

            <span>Total Amount</span>



            <strong>

              ₹{totalPrice.toLocaleString("en-IN")}

            </strong>

          </div>

        </div>



        {/* Continue to Demo Payment */}

        {lockError && (
          <p className="seat-preview-error" role="alert">{lockError}</p>
        )}

        <button
          type="button"
          className="seat-continue-button"
          disabled={selectedSeats.length === 0 || lockingSeats}
          onClick={handleContinueToPayment}
        >
          {lockingSeats
            ? "Reserving Seats..."
            : `Continue to Payment · ₹${totalPrice.toLocaleString("en-IN")}`}
        </button>



        <p className="seat-preview-note">

          Demo payment only. No real payment will be processed.

        </p>

      </section>

    </PageLayout>

  );

}



export default SeatPreview;
