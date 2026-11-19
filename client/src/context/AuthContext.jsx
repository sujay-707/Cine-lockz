
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import axios from "axios";

const AuthContext = createContext(null);

const API_BASE_URL = "http://localhost:5000/api";

const TOKEN_KEY = "cinelockz_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(true);

  // Restore and verify the existing login session
  const fetchCurrentUser = useCallback(async (authToken) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.data?.success || !response.data?.user) {
        throw new Error("Unable to verify login session");
      }

      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      throw error;
    }
  }, []);

  // Restore login after page refresh
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          }
        );

        if (!response.data?.success || !response.data?.user) {
          throw new Error("Unable to restore session");
        }

        if (active) {
          setToken(savedToken);
          setUser(response.data.user);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);

        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  // Save authenticated session
  const saveSession = useCallback((authData) => {
    if (!authData?.token || !authData?.user) {
      throw new Error("Invalid authentication response");
    }

    localStorage.setItem(TOKEN_KEY, authData.token);

    setToken(authData.token);
    setUser(authData.user);

    return authData.user;
  }, []);

  // Customer and Admin Login
  const login = useCallback(async (email, password) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/login`,
      {
        email,
        password,
      }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Login failed");
    }

    const loggedInUser = saveSession(response.data.data);

    return {
      user: loggedInUser,
      redirectTo: response.data.data.redirectTo,
    };
  }, [saveSession]);

  // Customer Signup
  const signup = useCallback(async (userData) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/signup`,
      userData
    );

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Signup failed");
    }

    const registeredUser = saveSession(response.data.data);

    return registeredUser;
  }, [saveSession]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);

    setToken(null);
    setUser(null);
  }, []);

  // Refresh user information
  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return null;
    }

    return fetchCurrentUser(token);
  }, [token, fetchCurrentUser]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === "admin",
    login,
    signup,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
