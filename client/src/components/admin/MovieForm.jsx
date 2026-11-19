
import { useEffect, useState } from "react";
import { X, Upload, Film } from "lucide-react";
import "../../styles/admin/MovieForm.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialForm = {
  title: "",
  description: "",
  genre: "",
  language: "",
  duration: "",
  releaseDate: "",
  rating: "",
  status: "published",
};

function MovieForm({ movie, onClose, onSubmit, isSubmitting = false }) {
  const [formData, setFormData] = useState(initialForm);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");

  useEffect(() => {
    if (movie) {
      setFormData({
        title: movie.title || "",
        description: movie.description || "",
        genre: Array.isArray(movie.genre)
          ? movie.genre[0] || ""
          : movie.genre || "",
        language: movie.language || "",
        duration: movie.duration || "",
        releaseDate: movie.releaseDate
          ? movie.releaseDate.slice(0, 10)
          : "",
        rating: movie.rating ?? "",
        status: (movie.status || "published").toLowerCase(),
      });

      setPosterPreview(
        movie.poster
          ? movie.poster.startsWith("http")
            ? movie.poster
            : `${API_BASE_URL}${movie.poster}`
          : ""
      );
    } else {
      setFormData(initialForm);
      setPosterPreview("");
    }

    setPosterFile(null);
  }, [movie]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Poster must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setPosterFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!movie && !posterFile) {
      alert("Please upload a movie poster.");
      return;
    }

    const payload = new FormData();

    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("genre", JSON.stringify([formData.genre]));
    payload.append("language", formData.language.trim());
    payload.append("duration", formData.duration);
    payload.append("releaseDate", formData.releaseDate);
    payload.append("rating", formData.rating || "0");
    payload.append("status", formData.status);

    if (posterFile) {
      payload.append("poster", posterFile);
    }

    onSubmit(payload);
  };

  return (
    <div className="movie-modal-overlay" onMouseDown={onClose}>
      <div
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="movie-modal-header">
          <div>
            <span className="movie-form-eyebrow">CINELOCKZ CATALOG</span>

            <h2 id="movie-form-title">
              {movie ? "Edit Movie" : "Add New Movie"}
            </h2>

            <p>
              {movie
                ? "Update the movie information."
                : "Enter the details to add a movie."}
            </p>
          </div>

          <button
            type="button"
            className="movie-modal-close"
            onClick={onClose}
            aria-label="Close form"
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="movie-form-grid">
            <div className="movie-form-field movie-form-full">
              <label htmlFor="title">Movie Title *</label>

              <input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter movie title"
                required
              />
            </div>

            <div className="movie-form-field movie-form-full">
              <label htmlFor="description">Description *</label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter movie description"
                rows="4"
                required
              />
            </div>

            <div className="movie-form-field">
              <label htmlFor="genre">Genre *</label>

              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
              >
                <option value="">Select genre</option>

                {[
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
                ].map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            <div className="movie-form-field">
              <label htmlFor="language">Language *</label>

              <input
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="e.g. Kannada"
                required
              />
            </div>

            <div className="movie-form-field">
              <label htmlFor="duration">Duration (minutes) *</label>

              <input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 150"
                required
              />
            </div>

            <div className="movie-form-field">
              <label htmlFor="rating">Rating (0–10)</label>

              <input
                id="rating"
                name="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                placeholder="e.g. 8.5"
              />
            </div>

            <div className="movie-form-field">
              <label htmlFor="releaseDate">Release Date *</label>

              <input
                id="releaseDate"
                name="releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="movie-form-field">
              <label htmlFor="status">Publication Status</label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="movie-form-field movie-form-full">
              <label>Movie Poster *</label>

              <label className="movie-poster-upload">
                {posterPreview ? (
                  <img
                    src={posterPreview}
                    alt="Movie poster preview"
                  />
                ) : (
                  <div className="movie-poster-placeholder">
                    <Upload size={25} />
                    <span>Click to upload poster</span>
                    <small>Image files · Maximum 5 MB</small>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePosterChange}
                  hidden
                />
              </label>

              {!posterPreview && (
                <small className="movie-upload-hint">
                  <Film size={13} />
                  A poster is required.
                </small>
              )}
            </div>
          </div>

          <div className="movie-modal-footer">
            <button
              type="button"
              className="movie-btn movie-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="movie-btn movie-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : movie
                  ? "Save Changes"
                  : "Add Movie"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MovieForm;
