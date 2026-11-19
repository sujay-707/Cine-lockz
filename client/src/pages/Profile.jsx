
import { useEffect, useState } from "react";
import axios from "axios";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

import "./Profile.css";

import { API_BASE_URL } from "../utils/api";

export default function Profile() {
  const { token, user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_BASE_URL}/customer/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfile(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-heading">
            <div>
              <span className="profile-eyebrow">
                CINELOCKZ ACCOUNT
              </span>
              <h1>My Profile</h1>
              <p>Manage your personal information and account details.</p>
            </div>
          </div>

          {loading ? (
            <div className="profile-state">
              <RefreshCw className="spin-icon" size={28} />
              <p>Loading your profile...</p>
            </div>
          ) : error ? (
            <div className="profile-state profile-error">
              <AlertCircle size={28} />
              <p>{error}</p>
              <button onClick={fetchProfile}>
                Try Again
              </button>
            </div>
          ) : profile ? (
            <>
              <section className="profile-overview">
                <div className="profile-avatar">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt={profile.name}
                    />
                  ) : (
                    <UserRound size={42} />
                  )}
                </div>

                <div className="profile-overview-info">
                  <h2>{profile.name}</h2>
                  <p>{profile.email}</p>

                  <div className="profile-badges">
                    <span className="profile-badge customer-badge">
                      Customer Account
                    </span>

                    <span
                      className={`profile-badge ${
                        profile.isActive
                          ? "active-badge"
                          : "inactive-badge"
                      }`}
                    >
                      {profile.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </section>

              <section className="profile-details-card">
                <div className="profile-section-heading">
                  <div>
                    <h3>Personal Information</h3>
                    <p>Your registered account information.</p>
                  </div>
                  <UserRound size={22} />
                </div>

                <div className="profile-details-grid">
                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <UserRound size={19} />
                    </div>
                    <div>
                      <span>Full Name</span>
                      <strong>{profile.name || "Not available"}</strong>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <Mail size={19} />
                    </div>
                    <div>
                      <span>Email Address</span>
                      <strong>{profile.email || "Not available"}</strong>
                      <small
                        className={
                          profile.isEmailVerified
                            ? "verified-text"
                            : "unverified-text"
                        }
                      >
                        {profile.isEmailVerified
                          ? "Verified"
                          : "Not verified"}
                      </small>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <Phone size={19} />
                    </div>
                    <div>
                      <span>Phone Number</span>
                      <strong>{profile.phone || "Not added"}</strong>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <ShieldCheck size={19} />
                    </div>
                    <div>
                      <span>Account Role</span>
                      <strong>
                        {profile.role === "user"
                          ? "Customer"
                          : profile.role}
                      </strong>
                    </div>
                  </div>

                  <div className="profile-detail-item">
                    <div className="detail-icon">
                      <CalendarDays size={19} />
                    </div>
                    <div>
                      <span>Member Since</span>
                      <strong>{memberSince}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <div className="profile-note">
                <ShieldCheck size={19} />
                <p>
                  Your account information is securely retrieved
                  from your CineLockz customer account.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}
