
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Wait until the saved login session is verified
  if (loading) {
    return (
      <div className="app-loading">
        Loading CineLockz...
      </div>
    );
  }

  // Redirect unauthenticated visitors to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Check whether the user's role is permitted
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role)
  ) {
    return (
      <Navigate
        to={user?.role === "admin" ? "/admin" : "/"}
        replace
      />
    );
  }

  return children;
}
