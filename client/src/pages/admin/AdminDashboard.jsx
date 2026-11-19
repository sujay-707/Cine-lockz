
import { useCallback, useEffect, useState } from "react";
import {
  Film,
  Building2,
  CalendarDays,
  Ticket,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

import "../../styles/admin/AdminDashboard.css";

import { API_BASE_URL } from "../../utils/api";

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function StatCard({ title, value, icon: Icon, description }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card-content">
        <div>
          <p className="admin-stat-title">{title}</p>
          <h2 className="admin-stat-value">{value}</h2>
          {description && (
            <p className="admin-stat-description">{description}</p>
          )}
        </div>

        <div className="admin-stat-icon">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("cinelockz_token");

      if (!token) {
        throw new Error("Admin session not found. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load dashboard statistics."
        );
      }

      setDashboard(result.data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = dashboard
    ? [
        {
          title: "Total Movies",
          value: formatNumber(dashboard.totalMovies),
          icon: Film,
          description: "Movies in your database",
        },
        {
          title: "Total Theatres",
          value: formatNumber(dashboard.totalTheatres),
          icon: Building2,
          description: "Registered theatres",
        },
        {
          title: "Active Shows",
          value: formatNumber(dashboard.activeShows),
          icon: CalendarDays,
          description: "Upcoming scheduled shows",
        },
        {
          title: "Total Bookings",
          value: formatNumber(dashboard.totalBookings),
          icon: Ticket,
          description: "All booking records",
        },
        {
          title: "Confirmed Bookings",
          value: formatNumber(dashboard.confirmedBookings),
          icon: CheckCircle2,
          description: "Successfully confirmed",
        },
        {
          title: "Successful Payments",
          value: formatNumber(dashboard.successfulPayments),
          icon: TrendingUp,
          description: "Payments completed",
        },
      ]
    : [];

  const trend = dashboard?.bookingTrend || [];

  const maxBookings = Math.max(
    1,
    ...trend.map((item) => Number(item.bookings || 0))
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your CineLockz platform.</p>
        </div>

        <button
          type="button"
          className="admin-refresh-btn"
          onClick={fetchDashboard}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "admin-spin" : ""}
          />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="admin-dashboard-error">
          <p>{error}</p>
          <button type="button" onClick={fetchDashboard}>
            Try again
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="admin-dashboard-loading">
          Loading dashboard statistics...
        </div>
      ) : dashboard ? (
        <>
          <div className="admin-stats-grid">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="admin-dashboard-bottom">
            <section className="admin-dashboard-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Booking Analytics</h2>
                  <p>Bookings over the last 7 days</p>
                </div>
              </div>

              {trend.length > 0 ? (
                <div className="admin-booking-trend">
                  {trend.map((item, index) => (
                    <div
                      className="admin-trend-item"
                      key={item.date || index}
                    >
                      <span className="admin-trend-value">
                        {formatNumber(item.bookings)}
                      </span>

                      <div className="admin-trend-track">
                        <div
                          className="admin-trend-bar"
                          style={{
                            height: `${
                              (Number(item.bookings || 0) / maxBookings) *
                              100
                            }%`,
                          }}
                        />
                      </div>

                      <span className="admin-trend-label">
                        {item.label || item.date}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-dashboard-empty">
                  No booking analytics available yet.
                </div>
              )}
            </section>

            <section className="admin-dashboard-panel admin-revenue-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Total Revenue</h2>
                  <p>From successful payments</p>
                </div>

                <div className="admin-revenue-icon">
                  <IndianRupee size={21} />
                </div>
              </div>

              <h2 className="admin-revenue-amount">
                {formatCurrency(dashboard.revenue)}
              </h2>

              <p className="admin-revenue-description">
                {formatNumber(dashboard.successfulPayments)} successful
                payments recorded.
              </p>
            </section>
          </div>
        </>
      ) : (
        !error && (
          <div className="admin-dashboard-empty">
            No dashboard data available.
          </div>
        )
      )}
    </div>
  );
}
