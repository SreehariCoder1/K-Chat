import { createContext, useState, useEffect } from "react";
import axios from "axios";

// Configure Axios
axios.defaults.baseURL = `http://${window.location.hostname}:5000/api`;
axios.defaults.withCredentials = true;

// eslint-disable-next-line react-refresh/only-export-components
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
      console.error("Auth check failed:", err);
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

  const deleteAccount = async () => {
    try {
      const response = await axios.delete("/users/me");
      setUser(null);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error("Delete account error:", err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to delete account",
      };
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

  const blockUser = async (userIdToBlock) => {
    try {
      const response = await axios.post(`/users/block/${userIdToBlock}`);
      setUser((prev) => ({
        ...prev,
        blockedUsers: response.data.blockedUsers,
      }));
      return { success: true };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to block user",
      };
    }
  };

  const unblockUser = async (userIdToUnblock) => {
    try {
      const response = await axios.post(`/users/unblock/${userIdToUnblock}`);
      setUser((prev) => ({
        ...prev,
        blockedUsers: response.data.blockedUsers,
      }));
      return { success: true };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to unblock user",
      };
    }
  };

  const addFavorite = async (userIdToFavorite) => {
    try {
      const response = await axios.post(`/users/favorite/${userIdToFavorite}`);
      setUser((prev) => ({
        ...prev,
        favorites: response.data.favorites,
      }));
      return { success: true };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to favorite user",
      };
    }
  };

  const removeFavorite = async (userIdToUnfavorite) => {
    try {
      const response = await axios.post(
        `/users/unfavorite/${userIdToUnfavorite}`,
      );
      setUser((prev) => ({
        ...prev,
        favorites: response.data.favorites,
      }));
      return { success: true };
    } catch (err) {
      console.error(err);
      return {
        success: false,
        message: err.response?.data?.message || "Failed to unfavorite user",
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
    blockUser,
    unblockUser,
    addFavorite,
    removeFavorite,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
