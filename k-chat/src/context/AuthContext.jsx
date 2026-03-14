import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Configure Axios
axios.defaults.baseURL = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get("/auth/check");
      setUser(response.data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    setError(null);
    try {
      const response = await axios.post("/auth/login", credentials);
      setUser(response.data.user);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await axios.post("/auth/register", userData);
      // We do not set the user here, because they still need to verify their email
      return { success: true, message: response.data.message };
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await axios.post("/auth/forgot-password", { email });
      return { success: true, message: response.data.message };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request");
      return {
        success: false,
        message: err.response?.data?.message || "Failed to process request",
      };
    }
  };

  const resetPassword = async (token, password) => {
    setError(null);
    try {
      const response = await axios.post(`/auth/reset-password/${token}`, {
        password,
      });
      return { success: true, message: response.data.message };
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
      return {
        success: false,
        message: err.response?.data?.message || "Failed to reset password",
      };
    }
  };

  const value = {
    user,
    loading,
    error,
    setError,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
