
import { Star, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import "./MovieCard.css";

export default function MovieCard({ movie }) {
  const genres = Array.isArray(movie.genre)
    ? movie.genre.filter(
        (genre) => genre && genre.toLowerCase() !== "tbd"
      )
    : movie.genre && movie.genre.toLowerCase() !== "tbd"
      ? [movie.genre]
      : [];

  const rating = Number(movie.rating);
  const hasRating = Number.isFinite(rating) && rating > 0;

  return (
    <article className="movie-card">
      <Link
        className="movie-card-poster"
        to={`/movies/${movie.slug}`}
        aria-label={`View ${movie.title} details`}
      >
        <img
          src={movie.image}
          alt={`${movie.title} movie poster`}
          loading="lazy"
        />

        {movie.tag && (
          <span className="movie-card-tag">{movie.tag}</span>
        )}

        <div className="movie-card-rating">
          {hasRating ? (
            <>
              <Star size={16} fill="currentColor" />
              <span>{rating.toFixed(1)}/10</span>
              {movie.votes && (
                <span className="movie-card-votes">
                  {movie.votes} Votes
                </span>
              )}
            </>
          ) : (
            <>
              <ThumbsUp size={15} />
              <span>Not Rated</span>
            </>
          )}
        </div>
      </Link>

      <div className="movie-card-info">
        <Link
          to={`/movies/${movie.slug}`}
          className="movie-card-title"
        >
          {movie.title}
        </Link>

        <p className="movie-card-genre">
          {genres.length > 0
            ? genres.join(" / ")
            : "Genre not available"}
        </p>
      </div>
    </article>
  );
}
