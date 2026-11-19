
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clapperboard, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await login(
        formData.email.trim(),
        formData.password
      );

      navigate(result.redirectTo, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background" />

      <Link to="/" className="login-brand">
        <Clapperboard size={30} />
        <span>CINELOCKZ</span>
      </Link>

      <section className="login-card">
        <div className="login-heading">
          <span className="login-eyebrow">WELCOME BACK</span>
          <h1>Sign in to CineLockz</h1>
          <p>Access your account and continue your movie experience.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <div className="login-input-wrapper">
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

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrapper">
              <Lock size={19} />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-divider">
          <span>NEW TO CINELOCKZ?</span>
        </div>

        <p className="login-signup-text">
          Don't have an account?{" "}
          <Link to="/signup">Create an account</Link>
        </p>

        <Link to="/" className="login-back-home">
          Back to Home
        </Link>
      </section>

      <footer className="login-footer">
        © 2026 CineLockz. All rights reserved.
      </footer>
    </main>
  );
}
