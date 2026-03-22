import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthProvider";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useEffect, useContext } from "react";
import ChatLayout from "./components/ChatLayout";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyEmail from "./components/VerifyEmail";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import { initAudioUnlocker } from "./utils/notificationSound";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Auth Route wrapper
const AuthRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/" />;

  return children;
};

const App = () => {
  useEffect(() => {
    initAudioUnlocker();
  }, []);

  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <AuthRoute>
                      <Login />
                    </AuthRoute>
                  }
                />

                <Route
                  path="/register"
                  element={
                    <AuthRoute>
                      <Register />
                    </AuthRoute>
                  }
                />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <ChatLayout />
                    </ProtectedRoute>
                  }
                />

                <Route path="/verify-email/:token" element={<VerifyEmail />} />

                <Route
                  path="/forgot-password"
                  element={
                    <AuthRoute>
                      <ForgotPassword />
                    </AuthRoute>
                  }
                />
                <Route
                  path="/reset-password/:token"
                  element={
                    <AuthRoute>
                      <ResetPassword />
                    </AuthRoute>
                  }
                />
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
