
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Clock3,
  Film,
  Monitor,
} from "lucide-react";
import "../../styles/admin/ManageShows.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const api = axios.create({ baseURL: `${API_URL}/api` });

const TURNAROUND_MINUTES = 15;

const SCREEN_TYPES = ["4K Laser", "Laser", "Dolby", "PXL"];

// CineLockz schedules all showtimes in Indian Standard Time.
const getIndiaDateTime = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
};

// Calculate the end time from the movie runtime.
// Supports shows ending after midnight.
const getCalculatedEndTime = (startTime, runtimeMinutes) => {
  if (
    !startTime ||
    !runtimeMinutes ||
    !Number.isFinite(Number(runtimeMinutes)) ||
    Number(runtimeMinutes) <= 0
  ) {
    return "";
  }

  const [hours, minutes] = startTime.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "";
  }

  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + Number(runtimeMinutes);

  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(
    endMins
  ).padStart(2, "0")}`;
};

const getRuntimeLabel = (runtimeMinutes) => {
  const runtime = Number(runtimeMinutes);

  if (!Number.isFinite(runtime) || runtime <= 0) {
    return "Runtime unavailable";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;

  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;

  return `${minutes} min`;
};

const isOvernight = (startTime, endTime) => {
  if (!startTime || !endTime) return false;

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  return (
    endHours * 60 + endMinutes <=
    startHours * 60 + startMinutes
  );
};

const emptyForm = {
  movie: "",
  theatre: "",
  screenId: "",
  showDate: "",
  startTime: "10:00",
  language: "English",
  format: "",
  regular: 150,
  premium: 250,
  recliner: 350,
};

function ManageShows() {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const [error, setError] = useState("");

  // Selected theatre
  const selectedTheatre = theatres.find(
    (theatre) => theatre._id === form.theatre
  );

  // Only active screens can be scheduled.
  const availableScreens =
    selectedTheatre?.screens?.filter((screen) => screen.isActive) || [];

  // Selected screen
  const selectedScreen = availableScreens.find(
    (screen) => screen._id === form.screenId
  );

  // Selected movie
  const selectedMovie = movies.find(
    (movie) => movie._id === form.movie
  );

  // Technology comes directly from the selected screen.
  const selectedScreenTechnology = selectedScreen?.screenType || "";

  // Calculate show end time from movie runtime.
  const calculatedEndTime = getCalculatedEndTime(
    form.startTime,
    selectedMovie?.duration
  );

  const overnightShow = isOvernight(
    form.startTime,
    calculatedEndTime
  );

  // Fetch shows, published movies and active theatres.
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [showResponse, movieResponse, theatreResponse] =
        await Promise.all([
          api.get("/shows"),
          api.get("/movies", { params: { status: "published" } }),
          api.get("/theatres", { params: { status: "active" } }),
        ]);

      setShows(showResponse.data.data || []);
      setMovies(movieResponse.data.data || []);
      setTheatres(theatreResponse.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load shows. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Search and filter shows.
  const filteredShows = useMemo(() => {
    return shows.filter((show) => {
      const movieTitle = show.movie?.title || "";
      const theatreName = show.theatre?.name || "";

      const matchesSearch =
        movieTitle.toLowerCase().includes(search.toLowerCase()) ||
        theatreName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || show.status === statusFilter;

      const showDate = show.showDate
        ? new Date(show.showDate).toISOString().slice(0, 10)
        : "";

      const matchesDate = !dateFilter || showDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [shows, search, statusFilter, dateFilter]);

  // Statistics.
  const scheduledCount = shows.filter(
    (show) => show.status === "scheduled"
  ).length;

  const cancelledCount = shows.filter(
    (show) => show.status === "cancelled"
  ).length;

  // Open Add Show modal.
  const openAddModal = () => {
    setSelectedShow(null);

    setForm({
      ...emptyForm,
      showDate: getIndiaDateTime().date,
    });

    setError("");
    setModalOpen(true);
  };

  // Open Edit Show modal.
  const openEditModal = (show) => {
    const theatreId = show.theatre?._id || show.theatre;

    setSelectedShow(show);

    setForm({
      movie: show.movie?._id || show.movie || "",
      theatre: theatreId || "",
      screenId: show.screen?.screenId || "",
      showDate: new Date(show.showDate).toISOString().slice(0, 10),
      startTime: show.startTime || "10:00",
      language: show.language || "English",
      format: show.format || show.screen?.screenType || "",
      regular: show.ticketPrices?.regular ?? 150,
      premium: show.ticketPrices?.premium ?? 250,
      recliner: show.ticketPrices?.recliner ?? 350,
    });

    setError("");
    setModalOpen(true);
  };

  // Update form fields.
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Select theatre and automatically select its first active screen.
  const handleTheatreChange = (theatreId) => {
    const theatre = theatres.find(
      (item) => item._id === theatreId
    );

    const firstScreen = theatre?.screens?.find(
      (screen) => screen.isActive
    );

    setForm((previous) => ({
      ...previous,
      theatre: theatreId,
      screenId: firstScreen?._id || "",
      format: firstScreen?.screenType || "",
    }));
  };

  // Select screen and automatically populate its technology.
  const handleScreenChange = (screenId) => {
    const screen = availableScreens.find(
      (item) => item._id === screenId
    );

    setForm((previous) => ({
      ...previous,
      screenId,
      format: screen?.screenType || "",
    }));
  };

  // Validate and submit show.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const { date: today, time: currentTime } = getIndiaDateTime();

    if (!form.movie) {
      setError("Please select a movie.");
      return;
    }

    if (
      !selectedMovie?.duration ||
      Number(selectedMovie.duration) <= 0
    ) {
      setError("The selected movie does not have a valid runtime.");
      return;
    }

    if (!form.showDate) {
      setError("Please select a show date.");
      return;
    }

    if (form.showDate < today) {
      setError("You cannot schedule a show on a past date.");
      return;
    }

    if (!form.startTime) {
      setError("Please select a show start time.");
      return;
    }

    if (
      form.showDate === today &&
      form.startTime <= currentTime
    ) {
      setError(
        `This start time has passed. Select a time after ${currentTime} IST.`
      );
      return;
    }

    if (!selectedTheatre) {
      setError("Please select an active theatre.");
      return;
    }

    if (!selectedScreen) {
      setError("Please select an available screen.");
      return;
    }

    if (!SCREEN_TYPES.includes(selectedScreen.screenType)) {
      setError("The selected screen has an unsupported technology.");
      return;
    }

    if (!calculatedEndTime) {
      setError("Unable to calculate the show end time.");
      return;
    }

    const prices = [
      form.regular,
      form.premium,
      form.recliner,
    ];

    if (
      prices.some(
        (price) =>
          price === "" ||
          !Number.isFinite(Number(price)) ||
          Number(price) < 0
      )
    ) {
      setError("Please enter valid ticket prices.");
      return;
    }

    // Technology is always taken from the selected screen.
    const payload = {
      movie: form.movie,
      theatre: form.theatre,

      screen: {
        screenId: form.screenId,
      },

      showDate: form.showDate,
      startTime: form.startTime,

      // Backend independently recalculates this from Movie.duration.
      endTime: calculatedEndTime,

      language: form.language,
      format: selectedScreen.screenType,

      ticketPrices: {
        regular: Number(form.regular),
        premium: Number(form.premium),
        recliner: Number(form.recliner),
      },
    };

    try {
      setSaving(true);

      if (selectedShow) {
        await api.put(`/shows/${selectedShow._id}`, payload);
      } else {
        await api.post("/shows", payload);
      }

      setModalOpen(false);
      setSelectedShow(null);

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save show. Please check the selected details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Update show status.
  const updateStatus = async (show, status) => {
    try {
      setError("");

      await api.put(`/shows/${show._id}`, { status });

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update show status."
      );
    }
  };

  // Delete show.
  const deleteShow = async (show) => {
    const confirmed = window.confirm(
      `Permanently delete the show for "${
        show.movie?.title || "this movie"
      }"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/shows/${show._id}`);

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete show."
      );
    }
  };

  // Format date.
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  // Format currency.
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  return (
    <div className="admin-page shows-page">
      {/* Page Heading */}
      <div className="shows-heading">
        <div>
          <span className="shows-eyebrow">
            SCHEDULE MANAGEMENT
          </span>

          <h1>Manage Shows</h1>

          <p>
            Schedule movies and manage cinema showtimes.
          </p>
        </div>

        <button
          className="shows-primary-btn"
          onClick={openAddModal}
          disabled={!movies.length || !theatres.length}
          title={
            !movies.length
              ? "Add a published movie first"
              : !theatres.length
                ? "Add an active theatre first"
                : "Schedule a show"
          }
        >
          <Plus size={19} />
          Schedule Show
        </button>
      </div>

      {error && !modalOpen && (
        <div className="shows-alert">{error}</div>
      )}

      {/* Statistics */}
      <div className="shows-stats">
        <div className="shows-stat-card">
          <Film />

          <div>
            <span>Total Shows</span>
            <strong>{shows.length}</strong>
          </div>
        </div>

        <div className="shows-stat-card">
          <CalendarDays />

          <div>
            <span>Scheduled</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>

        <div className="shows-stat-card">
          <Clock3 />

          <div>
            <span>Cancelled</span>
            <strong>{cancelledCount}</strong>
          </div>
        </div>
      </div>

      {/* Shows Table */}
      <div className="shows-table-card">
        <div className="shows-toolbar">
          <div className="shows-search">
            <Search size={18} />

            <input
              placeholder="Search movies or theatres..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="shows-filters">
            <input
              aria-label="Filter by show date"
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="shows-table-wrap">
          <table className="shows-table">
            <thead>
              <tr>
                <th>MOVIE</th>
                <th>THEATRE / SCREEN</th>
                <th>DATE</th>
                <th>TIME</th>
                <th>TECHNOLOGY</th>
                <th>PRICE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="shows-empty">
                    Loading shows...
                  </td>
                </tr>
              ) : filteredShows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="shows-empty">
                    {shows.length === 0
                      ? "No shows scheduled yet. Click Schedule Show to get started."
                      : "No shows match your search or filters."}
                  </td>
                </tr>
              ) : (
                filteredShows.map((show) => (
                  <tr key={show._id}>
                    <td>
                      <div className="show-movie-cell">
                        <div className="show-movie-icon">
                          <Film size={20} />
                        </div>

                        <div>
                          <strong>
                            {show.movie?.title || "Movie unavailable"}
                          </strong>

                          <span>{show.language}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="show-location-cell">
                        <strong>
                          {show.theatre?.name || "Theatre unavailable"}
                        </strong>

                        <span>
                          {show.screen?.name} · {show.theatre?.city}
                        </span>
                      </div>
                    </td>

                    <td>{formatDate(show.showDate)}</td>

                    <td>
                      <span className="show-time">
                        {show.startTime} – {show.endTime}

                        {show.endAt &&
                          show.startAt &&
                          new Date(show.endAt).getUTCDate() !==
                            new Date(show.startAt).getUTCDate() && (
                            <small> (next day)</small>
                          )}
                      </span>
                    </td>

                    <td>{show.format}</td>

                    <td>
                      {formatCurrency(show.ticketPrices?.regular)}
                    </td>

                    <td>
                      <span className={`show-status ${show.status}`}>
                        {show.status}
                      </span>
                    </td>

                    <td>
                      <div className="show-actions">
                        <button
                          title="Edit show"
                          onClick={() => openEditModal(show)}
                          disabled={show.status === "completed"}
                        >
                          <Pencil size={16} />
                        </button>

                        {show.status === "scheduled" && (
                          <button
                            title="Cancel show"
                            onClick={() =>
                              updateStatus(show, "cancelled")
                            }
                          >
                            <X size={17} />
                          </button>
                        )}

                        {show.status === "cancelled" && (
                          <button
                            title="Restore show"
                            onClick={() =>
                              updateStatus(show, "scheduled")
                            }
                          >
                            <CalendarDays size={16} />
                          </button>
                        )}

                        <button
                          className="delete"
                          title="Delete show"
                          onClick={() => deleteShow(show)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="shows-table-footer">
          Showing {filteredShows.length} of {shows.length} shows
        </div>
      </div>

      {/* Add / Edit Show Modal */}
      {modalOpen && (
        <div className="shows-modal-backdrop">
          <div className="shows-modal">
            <div className="shows-modal-header">
              <div>
                <h2>
                  {selectedShow ? "Edit Show" : "Schedule New Show"}
                </h2>

                <p>
                  Configure movie, theatre, timing and ticket prices.
                </p>
              </div>

              <button
                type="button"
                className="shows-close-btn"
                onClick={() => setModalOpen(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="shows-form-body">
                <h3>Movie & Location</h3>

                <div className="shows-form-grid">
                  {/* Movie */}
                  <label className="full">
                    Select Movie *

                    <select
                      required
                      value={form.movie}
                      onChange={(e) =>
                        updateField("movie", e.target.value)
                      }
                    >
                      <option value="">
                        Choose a published movie
                      </option>

                      {movies.map((movie) => (
                        <option key={movie._id} value={movie._id}>
                          {movie.title} · {movie.language}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Theatre */}
                  <label className="full">
                    Select Theatre *

                    <select
                      required
                      value={form.theatre}
                      onChange={(e) =>
                        handleTheatreChange(e.target.value)
                      }
                    >
                      <option value="">
                        Choose an active theatre
                      </option>

                      {theatres.map((theatre) => (
                        <option key={theatre._id} value={theatre._id}>
                          {theatre.name} · {theatre.city}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Screen */}
                  <label>
                    Select Screen *

                    <select
                      required
                      value={form.screenId}
                      onChange={(e) =>
                        handleScreenChange(e.target.value)
                      }
                      disabled={!availableScreens.length}
                    >
                      <option value="">Choose a screen</option>

                      {availableScreens.map((screen) => (
                        <option key={screen._id} value={screen._id}>
                          {screen.name} · {screen.screenType} ·{" "}
                          {screen.totalSeats} seats
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Language */}
                  <label>
                    Language *

                    <select
                      required
                      value={form.language}
                      onChange={(e) =>
                        updateField("language", e.target.value)
                      }
                    >
                      {[
                        "English",
                        "Kannada",
                        "Hindi",
                        "Tamil",
                        "Telugu",
                        "Malayalam",
                        "Marathi",
                        "Bengali",
                      ].map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Automatically selected screen technology */}
                  <label className="full">
                    Screen Technology

                    <input
                      type="text"
                      value={selectedScreenTechnology}
                      placeholder="Select a screen first"
                      readOnly
                      disabled
                    />

                    <small>
                      Automatically determined by the selected theatre
                      screen.
                    </small>
                  </label>
                </div>

                <h3 className="shows-section-title">
                  Show Schedule
                </h3>

                {selectedMovie && (
                  <div className="shows-screen-info">
                    <Clock3 size={18} />

                    <span>
                      Movie runtime:{" "}
                      {getRuntimeLabel(selectedMovie.duration)}
                      {" · "}
                      End time is calculated automatically.
                    </span>
                  </div>
                )}

                <div className="shows-form-grid">
                  {/* Show Date */}
                  <label>
                    Show Date *

                    <input
                      type="date"
                      required
                      min={getIndiaDateTime().date}
                      value={form.showDate}
                      onChange={(e) =>
                        updateField("showDate", e.target.value)
                      }
                    />
                  </label>

                  {/* Start Time */}
                  <label>
                    Start Time *

                    <input
                      type="time"
                      required
                      min={
                        form.showDate === getIndiaDateTime().date
                          ? getIndiaDateTime().time
                          : undefined
                      }
                      value={form.startTime}
                      onChange={(e) =>
                        updateField("startTime", e.target.value)
                      }
                    />
                  </label>

                  {/* Calculated End Time */}
                  <label>
                    Calculated End Time

                    <input
                      type="time"
                      value={calculatedEndTime}
                      readOnly
                      disabled
                    />

                    <small>
                      {calculatedEndTime
                        ? overnightShow
                          ? "Automatically calculated · Ends next day"
                          : "Automatically calculated from movie runtime"
                        : "Select a movie with a valid runtime"}
                    </small>
                  </label>
                </div>

                <h3 className="shows-section-title">
                  Ticket Pricing (INR)
                </h3>

                <div className="shows-form-grid">
                  {/* Regular */}
                  <label>
                    Regular Price *

                    <input
                      type="number"
                      min="0"
                      required
                      value={form.regular}
                      onChange={(e) =>
                        updateField("regular", e.target.value)
                      }
                    />
                  </label>

                  {/* Premium */}
                  <label>
                    Premium Price *

                    <input
                      type="number"
                      min="0"
                      required
                      value={form.premium}
                      onChange={(e) =>
                        updateField("premium", e.target.value)
                      }
                    />
                  </label>

                  {/* Recliner */}
                  <label>
                    Recliner Price

                    <input
                      type="number"
                      min="0"
                      value={form.recliner}
                      onChange={(e) =>
                        updateField("recliner", e.target.value)
                      }
                    />
                  </label>
                </div>

                {/* Selected screen information */}
                {selectedScreen && (
                  <div className="shows-screen-info">
                    <Monitor size={18} />

                    <span>
                      {selectedTheatre.name} · {selectedScreen.name} ·{" "}
                      {selectedScreen.screenType} ·{" "}
                      {selectedScreen.totalSeats} seats
                    </span>
                  </div>
                )}

                {/* Turnaround information */}
                <div className="shows-screen-info">
                  <Clock3 size={18} />

                  <span>
                    Screen turnaround: {TURNAROUND_MINUTES} minutes
                    after each show. The backend validates screen
                    availability.
                  </span>
                </div>

                {error && (
                  <div className="shows-alert">{error}</div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="shows-modal-footer">
                <button
                  type="button"
                  className="shows-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="shows-primary-btn"
                  disabled={
                    saving ||
                    !movies.length ||
                    !theatres.length ||
                    !calculatedEndTime ||
                    !selectedScreen
                  }
                >
                  {saving
                    ? "Saving..."
                    : selectedShow
                      ? "Save Changes"
                      : "Create Show"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageShows;
