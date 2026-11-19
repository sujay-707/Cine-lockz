
import { useEffect, useState } from "react";

import {
  Clapperboard,
  Menu,
  Search,
  X,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  LogOut,
  UserRound,
  ChevronDown,
  CalendarCheck,
  LayoutDashboard,
  Film,
  Building2,
  CalendarDays,
  Ticket,
  Info,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar({
  searchValue = "",
  onSearchChange,
}) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("cinelockz_theme") || "dark"
  );

  const location = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = isAuthenticated && user?.role === "admin";
  const isCustomer = isAuthenticated && user?.role === "user";

  // Role-based navigation links.
  const customerLinks = [
    { label: "Home", target: "home" },
    { label: "Movies", target: "movies" },
    { label: "Theatres", path: "/theatres", icon: Building2 },
    { label: "About Us", path: "/about-us", icon: Info },
  ];

  const adminLinks = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Movies", path: "/admin/movies", icon: Film },
    { label: "Theatres", path: "/admin/theatres", icon: Building2 },
    { label: "Shows", path: "/admin/shows", icon: CalendarDays },
    { label: "Bookings", path: "/admin/bookings", icon: Ticket },
  ];

  const navLinks = isAdmin
    ? adminLinks
    : customerLinks;

  // Apply theme globally.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cinelockz_theme", theme);
  }, [theme]);

  // Close menus when navigating.
  useEffect(() => {
    setMobileMenu(false);
    setAccountMenu(false);
  }, [location.pathname]);

  // Theme toggle.
  const toggleTheme = () => {
    setTheme((current) =>
      current === "dark" ? "light" : "dark"
    );
  };

  // Navigate to homepage sections.
  const goToSection = (target) => {
    setMobileMenu(false);

    if (location.pathname !== "/") {
      navigate("/", {
        state: { scrollTarget: target },
      });
      return;
    }

    if (target === "home") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    document
      .getElementById(target)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Navigate to pages.
  const handlePageNavigation = (path) => {
    setMobileMenu(false);
    navigate(path);
  };

  // Active navigation state.
  const isLinkActive = (item) => {
    if (item.path) {
      if (item.path === "/admin") {
        return location.pathname === "/admin";
      }

      return (
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
      );
    }

    return (
      location.pathname === "/" &&
      item.target === "home" &&
      window.scrollY < 300
    );
  };

  // Logout.
  const handleLogout = () => {
    logout();
    setMobileMenu(false);
    setAccountMenu(false);
    navigate("/", { replace: true });
  };

  return (
    <header className={`site-header ${isAdmin ? "admin-site-header" : ""}`}>
      {/* Brand */}
      <Link
        className="brand"
        to="/"
        aria-label="CineLockz Home"
        onClick={() => setMobileMenu(false)}
      >
        <span className="brand-mark">
          <Clapperboard size={25} strokeWidth={2.2} />
        </span>

        <span className="brand-name">
          Cine<span>Lockz</span>
        </span>
      </Link>

      {/* Mobile menu button */}
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMobileMenu((open) => !open)}
        aria-label={mobileMenu ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenu}
      >
        {mobileMenu ? <X /> : <Menu />}
      </button>

      {/* Role-based navigation */}
      <nav
        className={`main-nav ${mobileMenu ? "open" : ""}`}
        aria-label="Main navigation"
      >
        {navLinks.map((item) => {
          const active = isLinkActive(item);

          return item.path ? (
            <Link
              key={item.label}
              to={item.path}
              className={`nav-link ${active ? "active" : ""}`}
              onClick={() => setMobileMenu(false)}
            >
              {isAdmin && item.icon && <item.icon size={16} />}
              {item.label}
            </Link>
          ) : (
            <button
              type="button"
              key={item.label}
              className={`nav-link ${active ? "active" : ""}`}
              onClick={() => goToSection(item.target)}
            >
              {item.label}
            </button>
          );
        })}

        {/* Mobile account links */}
        <div className="mobile-auth-links">
          {!isAuthenticated ? (
            <>
              <Link to="/login" onClick={() => setMobileMenu(false)}>
                <LogIn size={16} />
                Login
              </Link>

              <Link to="/signup" onClick={() => setMobileMenu(false)}>
                <UserPlus size={16} />
                Sign Up
              </Link>
            </>
          ) : (
            <>
              {isCustomer && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenu(false)}
                  >
                    <UserRound size={16} />
                    My Profile
                  </Link>

                  <Link
                    to="/my-bookings"
                    onClick={() => setMobileMenu(false)}
                  >
                    <CalendarCheck size={16} />
                    My Bookings
                  </Link>
                </>
              )}

              {isAdmin && (
                <div className="mobile-admin-label">
                  Administrator Account
                </div>
              )}

              <button type="button" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Right side actions */}
      <div className="header-actions">

        {/* Movie search: customer and guest only */}
        {!isAdmin && (
          <label className="search-box">
            <Search size={18} />

            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
              onFocus={() => {
                if (location.pathname !== "/") {
                  navigate("/");
                }
              }}
              placeholder="Search movies..."
              aria-label="Search movies"
            />
          </label>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}
        </button>

        {/* Guest actions */}
        {!isAuthenticated ? (
          <div className="guest-actions">
            <Link to="/login" className="login-link">
              Login
            </Link>

            <Link to="/signup" className="signup-button">
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="user-actions">

            {/* Customer account */}
            {isCustomer && (
              <div className="account-dropdown">
                <button
                  type="button"
                  className={`user-profile account-trigger ${
                    accountMenu ? "account-open" : ""
                  }`}
                  onClick={() =>
                    setAccountMenu((open) => !open)
                  }
                  aria-expanded={accountMenu}
                  aria-haspopup="true"
                >
                  <UserRound size={18} />

                  <span>
                    {user?.name?.split(" ")[0] || "Account"}
                  </span>

                  <ChevronDown
                    size={15}
                    className={`account-chevron ${
                      accountMenu ? "rotated" : ""
                    }`}
                  />
                </button>

                {accountMenu && (
                  <div className="account-dropdown-menu">
                    <div className="account-dropdown-header">
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>

                    <Link
                      to="/profile"
                      className={
                        location.pathname === "/profile"
                          ? "dropdown-link active-dropdown-link"
                          : "dropdown-link"
                      }
                    >
                      <UserRound size={17} />
                      My Profile
                    </Link>

                    <Link
                      to="/my-bookings"
                      className={
                        location.pathname === "/my-bookings"
                          ? "dropdown-link active-dropdown-link"
                          : "dropdown-link"
                      }
                    >
                      <CalendarCheck size={17} />
                      My Bookings
                    </Link>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin account */}
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className="user-profile admin-profile"
                >
                  <UserRound size={17} />
                  <span>Admin</span>
                </Link>

                <button
                  type="button"
                  className="logout-button"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut size={17} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
