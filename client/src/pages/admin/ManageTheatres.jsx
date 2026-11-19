
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  MapPin,
  Monitor,
  Building2,
  Power,
} from "lucide-react";
import "../../styles/admin/ManageTheatres.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const theatreAPI = axios.create({ baseURL: `${API_URL}/api` });

const SCREEN_DEFAULTS = [
  {
    name: "Screen 1",
    screenNumber: 1,
    layoutId: "layout-1",
    screenType: "4K Laser",
    totalSeats: 500,
    isActive: true,
  },
  {
    name: "Screen 2",
    screenNumber: 2,
    layoutId: "layout-2",
    screenType: "Laser",
    totalSeats: 400,
    isActive: true,
  },
  {
    name: "Screen 3",
    screenNumber: 3,
    layoutId: "layout-3",
    screenType: "Dolby",
    totalSeats: 500,
    isActive: true,
  },
  {
    name: "Screen 4",
    screenNumber: 4,
    layoutId: "layout-4",
    screenType: "PXL",
    totalSeats: 800,
    isActive: true,
  },
];

const emptyForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  status: "active",
  amenities: [],
  screens: SCREEN_DEFAULTS.map((screen) => ({ ...screen })),
};

const amenityOptions = [
  "Parking",
  "Food Court",
  "Recliner Seats",
  "Wheelchair Accessible",
  "Dolby Atmos",
  "Online Booking",
];


const screenTechnologyOptions = [
  "4K Laser",
  "Laser",
  "Dolby",
  "PXL",
];

function ManageTheatres() {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [viewTheatre, setViewTheatre] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Fetch theatres
  const fetchTheatres = useCallback(async () => {
    try {
      setLoading(true);

      const response = await theatreAPI.get("/theatres");

      setTheatres(response.data.data || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load theatres."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTheatres();
  }, [fetchTheatres]);

  // Get unique cities
  const cities = useMemo(
    () =>
      [...new Set(theatres.map((theatre) => theatre.city).filter(Boolean))],
    [theatres]
  );

  // Search and filter theatres
  const filteredTheatres = useMemo(() => {
    return theatres.filter((theatre) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        theatre.name?.toLowerCase().includes(searchText) ||
        theatre.city?.toLowerCase().includes(searchText) ||
        theatre.address?.toLowerCase().includes(searchText);

      const matchesCity =
        cityFilter === "all" || theatre.city === cityFilter;

      const matchesStatus =
        statusFilter === "all" || theatre.status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [theatres, search, cityFilter, statusFilter]);

  // Dashboard statistics
  const activeCount = theatres.filter(
    (theatre) => theatre.status === "active"
  ).length;

  const totalScreens = theatres.reduce(
    (total, theatre) => total + (theatre.screens?.length || 0),
    0
  );

  const totalSeats = theatres.reduce(
    (total, theatre) =>
      total +
      (theatre.screens || []).reduce(
        (screenTotal, screen) =>
          screenTotal + Number(screen.totalSeats || 0),
        0
      ),
    0
  );

  // Open Add Theatre modal
  const openAddModal = () => {
    setSelectedTheatre(null);

    setForm({
      ...emptyForm,
      amenities: [],
      screens: SCREEN_DEFAULTS.map((screen) => ({ ...screen })),
    });

    setError("");
    setModalOpen(true);
  };

  // Open Edit Theatre modal
  // Existing screen IDs are preserved for backend updates.
  const openEditModal = (theatre) => {
    setSelectedTheatre(theatre);

    const screens = SCREEN_DEFAULTS.map((defaultScreen, index) => {
      const existingScreen = theatre.screens?.[index] || {};

      return {
        ...defaultScreen,
        ...existingScreen,
        name: existingScreen.name || defaultScreen.name,
        screenNumber: index + 1,
        layoutId: `layout-${index + 1}`,
        screenType:
          existingScreen.screenType || defaultScreen.screenType,
        totalSeats:
          existingScreen.totalSeats ?? defaultScreen.totalSeats,
        isActive: existingScreen.isActive ?? true,
      };
    });

    setForm({
      name: theatre.name || "",
      address: theatre.address || "",
      city: theatre.city || "",
      state: theatre.state || "",
      pincode: theatre.pincode || "",
      status: theatre.status || "active",
      amenities: theatre.amenities || [],
      screens,
    });

    setError("");
    setModalOpen(true);
  };

  // Update theatre information
  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Update individual screen
  const updateScreen = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      screens: previous.screens.map((screen, screenIndex) =>
        screenIndex === index
          ? { ...screen, [field]: value }
          : screen
      ),
    }));
  };

  // Toggle amenities
  const toggleAmenity = (amenity) => {
    setForm((previous) => ({
      ...previous,
      amenities: previous.amenities.includes(amenity)
        ? previous.amenities.filter((item) => item !== amenity)
        : [...previous.amenities, amenity],
    }));
  };

  // Validate and save theatre
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Exactly four screens are required
    if (form.screens.length !== 4) {
      setError("A theatre must have exactly four screens.");
      return;
    }

    // Validate screen names
    if (form.screens.some((screen) => !screen.name.trim())) {
      setError("Every screen must have a name.");
      return;
    }

    // Validate seat capacity
    const invalidCapacity = form.screens.some(
      (screen) =>
        !Number.isInteger(Number(screen.totalSeats)) ||
        Number(screen.totalSeats) < 1 ||
        Number(screen.totalSeats) > 2000
    );

    if (invalidCapacity) {
      setError("Each screen must have between 1 and 2000 seats.");
      return;
    }

    // Assign fixed screen numbers and layouts
    const payload = {
      ...form,
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      screens: form.screens.map((screen, index) => ({
        ...screen,
        screenNumber: index + 1,
        layoutId: `layout-${index + 1}`,
        totalSeats: Number(screen.totalSeats),
      })),
    };

    try {
      setSaving(true);

      if (selectedTheatre) {
        await theatreAPI.put(
          `/theatres/${selectedTheatre._id}`,
          payload
        );
      } else {
        await theatreAPI.post("/theatres", payload);
      }

      setModalOpen(false);
      setSelectedTheatre(null);

      await fetchTheatres();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save theatre. Please check the details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Activate or deactivate theatre
  const toggleStatus = async (theatre) => {
    const newStatus =
      theatre.status === "active" ? "inactive" : "active";

    try {
      await theatreAPI.put(`/theatres/${theatre._id}`, {
        status: newStatus,
      });

      await fetchTheatres();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update status."
      );
    }
  };

  // Delete theatre
  const deleteTheatre = async (theatre) => {
    const confirmed = window.confirm(
      `Delete "${theatre.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await theatreAPI.delete(`/theatres/${theatre._id}`);

      await fetchTheatres();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete theatre."
      );
    }
  };

  return (
    <div className="admin-page theatres-page">
      {/* Page Heading */}
      <div className="theatres-heading">
        <div>
          <span className="theatres-eyebrow">
            LOCATION MANAGEMENT
          </span>

          <h1>Manage Theatres</h1>

          <p>
            Manage cinema locations, screens and facilities.
          </p>
        </div>

        <button
          className="theatre-primary-btn"
          onClick={openAddModal}
        >
          <Plus size={19} />
          Add Theatre
        </button>
      </div>

      {/* Error Message */}
      {error && !modalOpen && (
        <div className="theatre-alert">{error}</div>
      )}

      {/* Statistics */}
      <div className="theatre-stats">
        <div className="theatre-stat-card">
          <Building2 />

          <div>
            <span>Total Theatres</span>
            <strong>{theatres.length}</strong>
          </div>
        </div>

        <div className="theatre-stat-card">
          <Power />

          <div>
            <span>Active Theatres</span>
            <strong>{activeCount}</strong>
          </div>
        </div>

        <div className="theatre-stat-card">
          <Monitor />

          <div>
            <span>Total Screens</span>
            <strong>{totalScreens}</strong>
          </div>
        </div>

        <div className="theatre-stat-card">
          <Building2 />

          <div>
            <span>Total Seats</span>
            <strong>{totalSeats.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* Theatre Table */}
      <div className="theatre-table-card">
        {/* Search and Filters */}
        <div className="theatre-toolbar">
          <div className="theatre-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search theatres or cities..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="theatre-filters">
            <select
              value={cityFilter}
              onChange={(event) => setCityFilter(event.target.value)}
            >
              <option value="all">All Cities</option>

              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="theatre-table-wrap">
          <table className="theatre-table">
            <thead>
              <tr>
                <th>THEATRE</th>
                <th>LOCATION</th>
                <th>SCREENS</th>
                <th>SEATING</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="theatre-empty">
                    Loading theatres...
                  </td>
                </tr>
              ) : filteredTheatres.length === 0 ? (
                <tr>
                  <td colSpan="6" className="theatre-empty">
                    {theatres.length === 0
                      ? "No theatres added yet. Click Add Theatre to get started."
                      : "No theatres match your search."}
                  </td>
                </tr>
              ) : (
                filteredTheatres.map((theatre) => {
                  const seatCount = (theatre.screens || []).reduce(
                    (total, screen) =>
                      total + Number(screen.totalSeats || 0),
                    0
                  );

                  return (
                    <tr key={theatre._id}>
                      <td>
                        <div className="theatre-name-cell">
                          <div className="theatre-icon">
                            <Building2 size={21} />
                          </div>

                          <div>
                            <strong>{theatre.name}</strong>

                            <span>
                              {theatre.screens?.length || 0} screens
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="theatre-location-cell">
                          <MapPin size={15} />

                          <div>
                            <strong>
                              {theatre.city}, {theatre.state}
                            </strong>

                            <span>{theatre.pincode}</span>
                          </div>
                        </div>
                      </td>

                      <td>{theatre.screens?.length || 0}</td>

                      <td>{seatCount.toLocaleString("en-IN")}</td>

                      <td>
                        <span
                          className={`theatre-status ${theatre.status}`}
                        >
                          {theatre.status}
                        </span>
                      </td>

                      <td>
                        <div className="theatre-actions">
                          <button
                            title="View theatre"
                            onClick={() => setViewTheatre(theatre)}
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            title="Edit theatre"
                            onClick={() => openEditModal(theatre)}
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            title={
                              theatre.status === "active"
                                ? "Deactivate"
                                : "Activate"
                            }
                            onClick={() => toggleStatus(theatre)}
                          >
                            <Power size={17} />
                          </button>

                          <button
                            className="delete"
                            title="Delete theatre"
                            onClick={() => deleteTheatre(theatre)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="theatre-table-footer">
          Showing {filteredTheatres.length} of {theatres.length} theatres
        </div>
      </div>

      {/* Add / Edit Theatre Modal */}
      {modalOpen && (
        <div className="theatre-modal-backdrop">
          <div className="theatre-modal">
            <div className="theatre-modal-header">
              <div>
                <h2>
                  {selectedTheatre ? "Edit Theatre" : "Add Theatre"}
                </h2>

                <p>
                  Enter theatre location and configure its four screens.
                </p>
              </div>

              <button
                className="theatre-close-btn"
                type="button"
                onClick={() => setModalOpen(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="theatre-form-body">
                {/* Theatre Information */}
                <h3>Theatre Information</h3>

                <div className="theatre-form-grid">
                  <label className="full">
                    Theatre Name *

                    <input
                      required
                      value={form.name}
                      onChange={(e) =>
                        updateField("name", e.target.value)
                      }
                      placeholder="e.g. PVR Orion Mall"
                    />
                  </label>

                  <label className="full">
                    Address *

                    <input
                      required
                      value={form.address}
                      onChange={(e) =>
                        updateField("address", e.target.value)
                      }
                      placeholder="Street, mall or landmark"
                    />
                  </label>

                  <label>
                    City *

                    <input
                      required
                      value={form.city}
                      onChange={(e) =>
                        updateField("city", e.target.value)
                      }
                      placeholder="Bengaluru"
                    />
                  </label>

                  <label>
                    State *

                    <input
                      required
                      value={form.state}
                      onChange={(e) =>
                        updateField("state", e.target.value)
                      }
                      placeholder="Karnataka"
                    />
                  </label>

                  <label>
                    PIN Code *

                    <input
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={form.pincode}
                      onChange={(e) =>
                        updateField("pincode", e.target.value)
                      }
                      placeholder="560001"
                    />
                  </label>

                  <label>
                    Status

                    <select
                      value={form.status}
                      onChange={(e) =>
                        updateField("status", e.target.value)
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                {/* Fixed Screen Configuration */}
                <div className="theatre-section-heading">
                  <div>
                    <h3>Screen Configuration</h3>

                    <p>
                      Four fixed layouts are assigned automatically.
                    </p>
                  </div>
                </div>

                {form.screens.map((screen, index) => (
                  <div className="theatre-screen-form" key={index}>
                    <div className="theatre-screen-top">
                      <strong>
                        Screen {index + 1} · Layout {index + 1}
                      </strong>

                      <span className="theatre-layout-fixed">
                        <Monitor size={14} />
                        Fixed Layout
                      </span>
                    </div>

                    <div className="theatre-form-grid">
                      <label>
                        Screen Name *

                        <input
                          required
                          value={screen.name}
                          onChange={(e) =>
                            updateScreen(index, "name", e.target.value)
                          }
                          placeholder={`Screen ${index + 1}`}
                        />
                      </label>

                      <label>
                        Screen Technology

                        <select
                          value={screen.screenType}
                          onChange={(e) =>
                            updateScreen(index, "screenType", e.target.value)
                          }
                        >
                          {screenTechnologyOptions.map((technology) => (
                            <option key={technology} value={technology}>
                              {technology}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Total Seat Capacity *

                        <input
                          required
                          type="number"
                          min="1"
                          max="2000"
                          step="1"
                          value={screen.totalSeats}
                          onChange={(e) =>
                            updateScreen(index, "totalSeats", e.target.value)
                          }
                        />
                      </label>

                      <label className="theatre-screen-active">
                        <input
                          type="checkbox"
                          checked={screen.isActive}
                          onChange={(e) =>
                            updateScreen(index, "isActive", e.target.checked)
                          }
                        />

                        Screen active
                      </label>
                    </div>
                  </div>
                ))}

                {/* Amenities */}
                <h3 className="theatre-amenities-title">
                  Amenities
                </h3>

                <div className="theatre-amenities">
                  {amenityOptions.map((amenity) => (
                    <label key={amenity}>
                      <input
                        type="checkbox"
                        checked={form.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />

                      {amenity}
                    </label>
                  ))}
                </div>

                {/* Form Error */}
                {error && (
                  <div className="theatre-alert">{error}</div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="theatre-modal-footer">
                <button
                  type="button"
                  className="theatre-cancel-btn"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="theatre-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : selectedTheatre
                      ? "Save Changes"
                      : "Create Theatre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Theatre Modal */}
      {viewTheatre && (
        <div className="theatre-modal-backdrop">
          <div className="theatre-modal theatre-view-modal">
            <div className="theatre-modal-header">
              <div>
                <h2>{viewTheatre.name}</h2>

                <p>
                  Theatre details and screen configuration
                </p>
              </div>

              <button
                className="theatre-close-btn"
                onClick={() => setViewTheatre(null)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="theatre-view-body">
              <p>
                <strong>Address:</strong> {viewTheatre.address}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {viewTheatre.city}, {viewTheatre.state} -{" "}
                {viewTheatre.pincode}
              </p>

              <p>
                <strong>Status:</strong> {viewTheatre.status}
              </p>

              <h3>Screens</h3>

              {(viewTheatre.screens || []).map((screen, index) => (
                <div
                  className="theatre-view-screen"
                  key={screen._id || index}
                >
                  <strong>
                    {screen.name || `Screen ${index + 1}`}
                  </strong>

                  <span>
                    Layout {screen.screenNumber || index + 1} ·{" "}
                    {screen.screenType} ·{" "}
                    {Number(screen.totalSeats).toLocaleString("en-IN")} seats
                  </span>

                  <span>
                    {screen.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}

              <h3>Amenities</h3>

              <p>
                {viewTheatre.amenities?.length
                  ? viewTheatre.amenities.join(", ")
                  : "No amenities listed"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTheatres;
