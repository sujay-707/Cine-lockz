
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Film,
  Star,
  Eye,
  EyeOff,
} from "lucide-react";

import MovieForm from "../../components/admin/MovieForm";
import "../../styles/admin/ManageMovies.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const movieAPI = axios.create({
  baseURL: `${API_URL}/api`,
});

const genres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Science Fiction",
  "Thriller",
];

function ManageMovies() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch movies from MongoDB
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await movieAPI.get("/movies");

      setMovies(response.data.data || []);
    } catch (err) {
      console.error("Fetch movies error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load movies. Please check the backend server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Filter movies
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesSearch = movie.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const movieGenres = Array.isArray(movie.genre)
        ? movie.genre
        : [movie.genre];

      const matchesGenre =
        genreFilter === "All" || movieGenres.includes(genreFilter);

      const matchesStatus =
        statusFilter === "All" ||
        movie.status === statusFilter.toLowerCase();

      return matchesSearch && matchesGenre && matchesStatus;
    });
  }, [movies, search, genreFilter, statusFilter]);

  // Open add form
  const openAddForm = () => {
    setSelectedMovie(null);
    setIsFormOpen(true);
  };

  // Open edit form
  const openEditForm = (movie) => {
    setSelectedMovie(movie);
    setIsFormOpen(true);
  };

  // Close form
  const closeForm = () => {
    if (isSubmitting) return;

    setIsFormOpen(false);
    setSelectedMovie(null);
  };

  // Add or update movie
  const handleSaveMovie = async (formData) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (selectedMovie) {
        await movieAPI.put(
          `/movies/${selectedMovie._id}`,
          formData
        );
      } else {
        await movieAPI.post("/movies", formData);
      }

      await fetchMovies();

      setIsFormOpen(false);
      setSelectedMovie(null);
    } catch (err) {
      console.error("Save movie error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to save movie. Please try again.";

      setError(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete movie
  const handleDeleteMovie = async (movie) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${movie.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await movieAPI.delete(`/movies/${movie._id}`);

      setMovies((previous) =>
        previous.filter((item) => item._id !== movie._id)
      );
    } catch (err) {
      console.error("Delete movie error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to delete movie.";

      setError(message);
      alert(message);
    }
  };

  // Publish / Unpublish movie
  const toggleMovieStatus = async (movie) => {
    const newStatus =
      movie.status === "published" ? "draft" : "published";

    const formData = new FormData();
    formData.append("status", newStatus);

    try {
      setError("");

      const response = await movieAPI.put(
        `/movies/${movie._id}`,
        formData
      );

      const updatedMovie = response.data.data;

      setMovies((previous) =>
        previous.map((item) =>
          item._id === movie._id ? updatedMovie : item
        )
      );
    } catch (err) {
      console.error("Status update error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to update publication status.";

      setError(message);
      alert(message);
    }
  };

  // Poster URL
  const getPosterUrl = (poster) => {
    if (!poster) return "";

    if (poster.startsWith("http")) {
      return poster;
    }

    return `${API_URL}${poster}`;
  };

  return (
    <div className="manage-movies-page">
      {/* Page heading */}
      <div className="movies-page-heading">
        <div>
          <span className="admin-eyebrow">
            CONTENT MANAGEMENT
          </span>

          <h2>Manage Movies</h2>

          <p>
            Manage your movie catalog and publication status.
          </p>
        </div>

        <button
          className="movies-add-button"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Movie
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="movies-error-message" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="movies-summary">
        <div className="movies-summary-card">
          <Film size={21} />
          <div>
            <span>Total Movies</span>
            <strong>{movies.length}</strong>
          </div>
        </div>

        <div className="movies-summary-card">
          <Eye size={21} />
          <div>
            <span>Published</span>
            <strong>
              {
                movies.filter(
                  (movie) => movie.status === "published"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="movies-summary-card">
          <EyeOff size={21} />
          <div>
            <span>Drafts</span>
            <strong>
              {
                movies.filter(
                  (movie) => movie.status === "draft"
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {/* Movies table */}
      <section className="movies-table-panel">
        <div className="movies-toolbar">
          <div className="movies-search">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search movies..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="movies-filters">
            <select
              value={genreFilter}
              onChange={(event) =>
                setGenreFilter(event.target.value)
              }
              aria-label="Filter by genre"
            >
              <option value="All">All Genres</option>

              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter by status"
            >
              <option value="All">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="movies-table-scroll">
          <table className="movies-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Genre</th>
                <th>Language</th>
                <th>Release Date</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="movies-empty-state">
                      Loading movies...
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredMovies.map((movie) => (
                    <tr key={movie._id}>
                      <td>
                        <div className="movie-table-info">
                          <img
                            src={getPosterUrl(movie.poster)}
                            alt={movie.title}
                          />

                          <div>
                            <strong>{movie.title}</strong>
                            <span>{movie.duration} min</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {Array.isArray(movie.genre)
                          ? movie.genre.join(", ")
                          : movie.genre}
                      </td>

                      <td>{movie.language}</td>

                      <td>
                        {movie.releaseDate
                          ? new Date(
                              movie.releaseDate
                            ).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td>
                        <span className="movie-rating">
                          <Star size={14} />
                          {movie.rating ?? "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`movie-status ${
                            movie.status === "published"
                              ? "published"
                              : "draft"
                          }`}
                        >
                          {movie.status}
                        </span>
                      </td>

                      <td>
                        <div className="movie-actions">
                          <button
                            type="button"
                            title="Edit movie"
                            aria-label={`Edit ${movie.title}`}
                            onClick={() =>
                              openEditForm(movie)
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title={
                              movie.status === "published"
                                ? "Unpublish movie"
                                : "Publish movie"
                            }
                            aria-label={`Toggle publication for ${movie.title}`}
                            onClick={() =>
                              toggleMovieStatus(movie)
                            }
                          >
                            {movie.status === "published" ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            className="movie-delete-action"
                            title="Delete movie"
                            aria-label={`Delete ${movie.title}`}
                            onClick={() =>
                              handleDeleteMovie(movie)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredMovies.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="movies-empty-state">
                          <Film size={35} />

                          <h3>
                            {movies.length === 0
                              ? "No movies added yet"
                              : "No movies found"}
                          </h3>

                          <p>
                            {movies.length === 0
                              ? "Start building your catalog by adding your first movie."
                              : "Try changing your search or filters."}
                          </p>

                          {movies.length === 0 && (
                            <button
                              className="movies-add-button"
                              onClick={openAddForm}
                            >
                              <Plus size={17} />
                              Add Your First Movie
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="movies-table-footer">
          Showing {filteredMovies.length} of {movies.length} movies
        </div>
      </section>

      {/* Add / Edit modal */}
      {isFormOpen && (
        <MovieForm
          movie={selectedMovie}
          onClose={closeForm}
          onSubmit={handleSaveMovie}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default ManageMovies;
