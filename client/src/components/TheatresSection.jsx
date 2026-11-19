
import { useEffect, useState } from "react";
import axios from "axios";
import "./TheatresSection.css";

const API_BASE_URL = "http://localhost:5000/api";

export default function TheatresSection() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchTheatres = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE_URL}/theatres`,
          {
            params: { status: "active" },
            signal: controller.signal,
          }
        );

        if (!response.data.success) {
          throw new Error("Unable to load theatres.");
        }

        setTheatres(response.data.data || []);
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
          "Unable to connect to the theatre service."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchTheatres();

    return () => controller.abort();
  }, []);

  return (
    <section className="theatres-section" id="theatres">
      <div className="theatres-heading">
        <div>
          <span className="theatres-overline">
            YOUR CINEMA DESTINATION
          </span>

          <h2>Explore Our Theatres</h2>

          <p>
            Discover premium screens and enjoy movies
            the way they were meant to be experienced.
          </p>
        </div>

        <span className="theatres-count">
          {theatres.length} {theatres.length === 1 ? "THEATRE" : "THEATRES"}
        </span>
      </div>

      {loading && (
        <div className="theatres-state">
          Loading theatres...
        </div>
      )}

      {!loading && error && (
        <div className="theatres-state">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && theatres.length === 0 && (
        <div className="theatres-state">
          No active theatres are currently available.
        </div>
      )}

      {!loading && !error && theatres.length > 0 && (
        <div className="theatres-grid">
          {theatres.map((theatre) => {
            const activeScreens = (theatre.screens || []).filter(
              (screen) => screen.isActive
            );

            const totalSeats = activeScreens.reduce(
              (total, screen) => total + Number(screen.totalSeats || 0),
              0
            );

            const technologies = [
              ...new Set(
                activeScreens.map((screen) => screen.screenType)
              ),
            ];

            return (
              <article
                className="theatre-discovery-card"
                key={theatre._id}
              >
                <div className="theatre-card-visual">
                  <div className="theatre-visual-pattern">
                    <span>CINELOCKZ</span>
                    <div className="theatre-visual-symbol">C</div>
                    <small>THE CINEMA EXPERIENCE</small>
                  </div>

                  <span className="theatre-status">
                    <span />
                    NOW ACTIVE
                  </span>
                </div>

                <div className="theatre-card-content">
                  <span className="theatre-card-label">
                    CINEMATIC EXPERIENCE
                  </span>

                  <h3>{theatre.name}</h3>

                  <p className="theatre-address">
                    {theatre.address}, {theatre.city},{" "}
                    {theatre.state} - {theatre.pincode}
                  </p>

                  <div className="theatre-card-stats">
                    <div>
                      <strong>{activeScreens.length}</strong>
                      <span>Active Screens</span>
                    </div>

                    <div>
                      <strong>{totalSeats.toLocaleString("en-IN")}</strong>
                      <span>Total Seats</span>
                    </div>
                  </div>

                  <div className="theatre-technologies">
                    {technologies.map((technology) => (
                      <span key={technology}>
                        {technology}
                      </span>
                    ))}
                  </div>

                  {Array.isArray(theatre.amenities) &&
                    theatre.amenities.length > 0 && (
                      <div className="theatre-amenities">
                        <span>AMENITIES</span>

                        <p>
                          {theatre.amenities.slice(0, 4).join(" · ")}
                        </p>
                      </div>
                    )}

                  <div className="theatre-card-footer">
                    <span>Experience the big screen</span>
                    <span className="theatre-card-arrow">↗</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
