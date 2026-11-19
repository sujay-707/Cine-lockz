
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  MapPin,
  Play,
  Star,
  Ticket,
} from "lucide-react";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_BASE_URL = "http://localhost:5000/api";
const SERVER_BASE_URL = "http://localhost:5000";

// Build a usable image URL from the backend poster path.
const getPosterUrl = (poster) => {
  if (!poster) return "";

  if (poster.startsWith("http://") || poster.startsWith("https://")) {
    return poster;
  }

  return `${SERVER_BASE_URL}${poster.startsWith("/") ? "" : "/"}${poster}`;
};

// Format date without changing the calendar date.
const getDateKey = (date) => {
  if (!date) return "";

  return new Date(date).toISOString().slice(0, 10);
};

const formatDateParts = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  return {
    day: date.toLocaleDateString("en-IN", {
      weekday: "short",
      timeZone: "UTC",
    }),
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      timeZone: "UTC",
    }),
    month: date.toLocaleDateString("en-IN", {
      month: "short",
      timeZone: "UTC",
    }),
    fullDate: date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
  };
};

export default function MovieDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("All");
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch movie details and its scheduled shows from MongoDB.
  useEffect(() => {
    const controller = new AbortController();

    const fetchMovieAndShows = async () => {
      try {
        setLoading(true);
        setError("");

        setMovie(null);
        setShows([]);
        setSelectedDate("");
        setSelectedFormat("All");
        setSelectedShowtime(null);

        // Step 1: Fetch published movies.
        const movieResponse = await axios.get(
          `${API_BASE_URL}/movies`,
          {
            params: {
              status: "published",
            },
            signal: controller.signal,
          }
        );

        if (!movieResponse.data.success) {
          throw new Error("Unable to retrieve movie details.");
        }

        // Find the requested movie using its database slug.
        const foundMovie = (movieResponse.data.data || []).find(
          (item) => item.slug === slug
        );

        if (!foundMovie) {
          setMovie(null);
          return;
        }

        setMovie(foundMovie);

        // Step 2: Fetch scheduled shows for this movie ID.
        const showResponse = await axios.get(
          `${API_BASE_URL}/shows`,
          {
            params: {
              status: "scheduled",
              movie: foundMovie._id,
            },
            signal: controller.signal,
          }
        );

        if (!showResponse.data.success) {
          throw new Error("Unable to retrieve movie showtimes.");
        }

        const movieShows = (showResponse.data.data || []).filter(
          (show) =>
            show.movie &&
            show.theatre &&
            show.status === "scheduled"
        );

        setShows(movieShows);
      } catch (err) {
        if (
          err.code === "ERR_CANCELED" ||
          err.name === "CanceledError"
        ) {
          return;
        }

        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not connect to the CineLockz server."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMovieAndShows();

    return () => controller.abort();
  }, [slug]);

  // Available dates from actual MongoDB shows.
  const availableDates = useMemo(() => {
    const uniqueDates = [
      ...new Set(
        shows
          .map((show) => getDateKey(show.showDate))
          .filter(Boolean)
      ),
    ].sort();

    return uniqueDates.map((dateKey) => ({
      key: dateKey,
      ...formatDateParts(dateKey),
    }));
  }, [shows]);

  // Automatically select the first available date.
  useEffect(() => {
    if (availableDates.length > 0) {
      setSelectedDate((previous) =>
        availableDates.some((date) => date.key === previous)
          ? previous
          : availableDates[0].key
      );
    } else {
      setSelectedDate("");
    }
  }, [availableDates]);

  // Actual screen technologies available for this movie.
  const availableFormats = useMemo(() => {
    const formats = [
      ...new Set(
        shows
          .map((show) => show.format)
          .filter(Boolean)
      ),
    ];

    return ["All", ...formats];
  }, [shows]);

  // Filter shows by date and screen technology.
  const filteredShows = useMemo(() => {
    return shows.filter((show) => {
      const matchesDate =
        getDateKey(show.showDate) === selectedDate;

      const matchesFormat =
        selectedFormat === "All" ||
        show.format === selectedFormat;

      return matchesDate && matchesFormat;
    });
  }, [shows, selectedDate, selectedFormat]);

  // Group shows by theatre.
  const theatreGroups = useMemo(() => {
    const grouped = new Map();

    filteredShows.forEach((show) => {
      const theatreId = show.theatre?._id;

      if (!theatreId) return;

      if (!grouped.has(theatreId)) {
        grouped.set(theatreId, {
          id: theatreId,
          name: show.theatre.name,
          city: show.theatre.city,
          state: show.theatre.state,
          shows: [],
        });
      }

      grouped.get(theatreId).shows.push(show);
    });

    return [...grouped.values()];
  }, [filteredShows]);

  // Select a showtime.
  const handleShowtimeSelect = (show) => {
    setSelectedShowtime(show);
  };

  // Navigate to the seat layout for this exact show.
  const handleContinue = () => {
    if (!selectedShowtime?._id) return;

    navigate(`/booking/${selectedShowtime._id}`);
  };

  // Movie loading state.
  if (loading) {
    return (
      <div className="app-shell">
        <Navbar />

        <main className="details-page">
          <div className="showtime-message">
            <div className="showtime-loader" />
            <p>Loading movie details...</p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // API error state.
  if (error) {
    return (
      <div className="app-shell">
        <Navbar />

        <main className="details-page">
          <h1>Unable to load movie</h1>
          <p>{error}</p>

          <button
            className="button button-gold"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </main>

        <Footer />
      </div>
    );
  }

  // Movie not found in published MongoDB records.
  if (!movie) {
    return (
      <div className="app-shell">
        <Navbar />

        <main className="details-page">
          <h1>Movie not found</h1>

          <p>
            This movie may not exist or may not currently be published.
          </p>

          <button
            className="button button-gold"
            onClick={() => navigate("/")}
          >
            Back to home
          </button>
        </main>

        <Footer />
      </div>
    );
  }

  const genres = Array.isArray(movie.genre)
    ? movie.genre.join(", ")
    : movie.genre || "";

  const posterUrl = getPosterUrl(movie.poster);

  return (
    <div className="app-shell">
      <Navbar />

      <main className="details-page">
        {/* Back Navigation */}
        <button
          className="back-link"
          onClick={() => navigate("/")}
        >
          <ChevronLeft size={18} />
          Back to movies
        </button>

        {/* Movie Details */}
        <section className="movie-detail-hero">
          <div className="detail-poster">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={`${movie.title} poster`}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="poster-placeholder">
                <Ticket size={38} />
                <span>{movie.title}</span>
              </div>
            )}
          </div>

          <div className="detail-copy">
            <span className="detail-eyebrow">
              NOW SHOWING
            </span>

            <h1>{movie.title}</h1>

            <div className="detail-rating">
              <Star size={17} fill="currentColor" />
              {movie.rating ?? "N/A"}
              <span>Audience rating</span>
            </div>

            <div className="detail-facts">
              {movie.duration > 0 && (
                <>
                  <span>{movie.duration} min</span>
                  <i />
                </>
              )}

              {movie.language && (
                <>
                  <span>{movie.language}</span>
                  <i />
                </>
              )}

              {genres && <span>{genres}</span>}
            </div>

            <p>
              {movie.description || "Movie description coming soon."}
            </p>

            <div className="detail-actions">
              <button
                className="button button-gold"
                onClick={() =>
                  document
                    .getElementById("showtimes")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                <Ticket size={17} />
                Book tickets
              </button>

              <button
                className="button button-outline"
                onClick={() =>
                  window.alert(
                    "Trailer preview will be connected in a later milestone."
                  )
                }
              >
                <Play size={16} />
                Watch trailer
              </button>
            </div>
          </div>
        </section>

        {/* Showtime Selection */}
        <section
          className="showtimes-section"
          id="showtimes"
        >
          <div className="showtimes-title">
            <div>
              <p className="section-overline">
                CHOOSE YOUR EXPERIENCE
              </p>

              <h2>Select a showtime</h2>
            </div>

            <span className="city-label">
              <MapPin size={15} />
              Bengaluru
            </span>
          </div>

          {/* No scheduled shows */}
          {shows.length === 0 && (
            <div className="showtime-message">
              <h3>No scheduled shows</h3>

              <p>
                There are currently no scheduled showtimes
                for this movie. Please check again later.
              </p>
            </div>
          )}

          {shows.length > 0 && (
            <>
              {/* Date and screen technology filters */}
              <div className="booking-filters">
                <div className="date-picker-row">
                  {availableDates.map((date) => (
                    <button
                      key={date.key}
                      className={
                        selectedDate === date.key
                          ? "date-chip selected"
                          : "date-chip"
                      }
                      onClick={() => {
                        setSelectedDate(date.key);
                        setSelectedShowtime(null);
                      }}
                    >
                      <span>{date.day}</span>
                      <b>{date.date}</b>
                      <small>{date.month}</small>
                    </button>
                  ))}
                </div>

                <div className="format-picker">
                  <span>SCREEN TYPE</span>

                  {availableFormats.map((format) => (
                    <button
                      key={format}
                      className={
                        selectedFormat === format
                          ? "format-chip selected"
                          : "format-chip"
                      }
                      onClick={() => {
                        setSelectedFormat(format);
                        setSelectedShowtime(null);
                      }}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theatre Cards */}
              <div className="theatre-list">
                {theatreGroups.map((theatre) => (
                  <article
                    className="theatre-card"
                    key={theatre.id}
                  >
                    <div className="theatre-info">
                      <h3>{theatre.name}</h3>

                      <p>
                        <MapPin size={13} />
                        {[theatre.city, theatre.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>

                      <span>
                        {theatre.shows.length} showtime(s)
                      </span>
                    </div>

                    <div className="showtime-options">
                      {theatre.shows
                        .slice()
                        .sort((a, b) =>
                          a.startTime.localeCompare(b.startTime)
                        )
                        .map((show) => (
                          <button
                            key={show._id}
                            className={
                              selectedShowtime?._id === show._id
                                ? "showtime-chip selected"
                                : "showtime-chip"
                            }
                            onClick={() =>
                              handleShowtimeSelect(show)
                            }
                          >
                            <Clock3 size={13} />
                            {show.startTime}

                            <small>
                              {show.screen?.name}
                            </small>
                          </button>
                        ))}
                    </div>

                    <div className="theatre-legend">
                      <span className="available-dot" />
                      Scheduled
                    </div>
                  </article>
                ))}

                {theatreGroups.length === 0 && (
                  <div className="showtime-message">
                    <p>
                      No shows available for the selected
                      date and screen type.
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Showtime */}
              {selectedShowtime && (
                <div className="selection-summary">
                  <div>
                    <CheckCircle2 size={20} />

                    <span>
                      <b>Showtime selected</b>

                      <small>
                        {selectedShowtime.theatre.name}
                        {" · "}
                        {formatDateParts(
                          getDateKey(selectedShowtime.showDate)
                        ).fullDate}
                        {" · "}
                        {selectedShowtime.startTime}
                        {" · "}
                        {selectedShowtime.screen?.name}
                        {" · "}
                        {selectedShowtime.format}
                      </small>
                    </span>
                  </div>

                  <button
                    className="button button-gold"
                    onClick={handleContinue}
                  >
                    Continue to seats
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <p className="booking-note">
          Movie information and showtimes are retrieved from
          the CineLockz database.
        </p>
      </main>

      <Footer />
    </div>
  );
}
