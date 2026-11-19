
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowRight } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieCard from "../components/MovieCard";
import Hero from "../components/Hero";
import FeatureBar from "../components/FeatureBar";

import { API_BASE_URL, SERVER_BASE_URL } from "../utils/api";

// Convert backend poster path into a complete image URL.
const getPosterUrl = (poster) => {
  if (!poster || typeof poster !== "string") return "";

  if (
    poster.startsWith("http://") ||
    poster.startsWith("https://")
  ) {
    return poster;
  }

  return `${SERVER_BASE_URL}${poster.startsWith("/") ? "" : "/"}${poster}`;
};

// Convert MongoDB movie into the frontend format.
const formatMovieForCard = (movie) => ({
  ...movie,
  image: getPosterUrl(movie.poster),
  genre: Array.isArray(movie.genre)
    ? movie.genre.join(", ")
    : movie.genre || "",
  rating: movie.rating ?? "N/A",
});

export default function Home() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch published movies from MongoDB.
  useEffect(() => {
    const controller = new AbortController();

    const fetchMovies = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(
          `${API_BASE_URL}/movies`,
          {
            params: {
              status: "published",
            },
            signal: controller.signal,
          }
        );

        if (!response.data.success) {
          throw new Error("Unable to retrieve movies.");
        }

        const publishedMovies = (
          response.data.data || []
        ).filter(
          (movie) => movie.status === "published"
        );

        const formattedMovies = publishedMovies.map(
          formatMovieForCard
        );

        setMovies(formattedMovies);
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

    fetchMovies();

    return () => controller.abort();
  }, []);

  // Search published movies.
  const filteredMovies = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) return movies;

    return movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchTerm)
    );
  }, [movies, query]);

  return (
    <div className="app-shell">
      <Navbar
        searchValue={query}
        onSearchChange={setQuery}
      />

      <main id="home">
        {/* Promotional Movie and Event Carousel */}
        <Hero />

        {/* Now Showing */}
        <section
          className="content-section"
          id="movies"
        >
          <div className="section-heading">
            <div>
              <span className="gold-rule" />

              <div>
                <p className="section-overline">
                  FIND YOUR NEXT FAVOURITE
                </p>

                <h2>Now Showing</h2>
              </div>
            </div>

            <button
              className="text-link"
              onClick={() => setQuery("")}
            >
              View All
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="empty-state">
              Loading movies...
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="empty-state">
              <p>{error}</p>

              <button
                className="button button-gold"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {/* Movie Grid */}
          {!loading && !error && (
            <div className="movie-grid">
              {filteredMovies.map((movie) => (
                <MovieCard
                  movie={movie}
                  key={movie._id}
                />
              ))}

              {filteredMovies.length === 0 && (
                <p className="empty-state">
                  {movies.length === 0
                    ? "No movies are currently showing."
                    : `No movies match "${query}". Try another title.`}
                </p>
              )}
            </div>
          )}
        </section>

        {/* CineLockz Features */}
        <FeatureBar />
      </main>

      <Footer />
    </div>
  );
}
