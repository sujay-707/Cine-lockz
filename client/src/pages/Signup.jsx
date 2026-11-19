
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clapperboard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password,
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page">
      <div className="signup-background" />

      <Link to="/" className="signup-brand">
        <Clapperboard size={30} />
        <span>CINELOCKZ</span>
      </Link>

      <section className="signup-card">
        <div className="signup-heading">
          <span className="signup-eyebrow">JOIN CINELOCKZ</span>
          <h1>Create your account</h1>
          <p>Sign up and get ready for your next cinematic experience.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="signup-field">
            <label htmlFor="name">Full name</label>
            <div className="signup-input-wrapper">
              <User size={19} />
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="email">Email address</label>
            <div className="signup-input-wrapper">
              <Mail size={19} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="phone">Phone number (optional)</label>
            <div className="signup-input-wrapper">
              <Phone size={19} />
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="password">Password</label>
            <div className="signup-input-wrapper">
              <Lock size={19} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <div className="signup-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="signup-input-wrapper">
              <Lock size={19} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="signup-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="signup-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="signup-divider">
          <span>ALREADY A MEMBER?</span>
        </div>

        <p className="signup-login-text">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="signup-back-home">
          Back to Home
        </Link>
      </section>

      <footer className="signup-footer">
        © 2026 CineLockz. All rights reserved.
      </footer>
    </main>
  );
}
