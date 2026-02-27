import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/Login.module.css";
import bgStyles from "../styles/backgroundAnimation.module.css";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (setError) setError(null);
  }, [setError]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ identifier, password });
    if (result.success) {
      navigate("/");
    }
  };

  return (
    <div className={styles.container}>
      <div className={bgStyles.bg}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg2}`}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg3}`}></div>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <span className={styles.palmTree}>🌴</span>
          <span className={styles.logoText}>K-Chat</span>
        </div>
        <p className={styles.subtitle}>Welcome back! Sign in to continue</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.errorText}> {error} </p>}

          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Email or username"
              className={styles.input}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`${styles.input} ${styles.passwordInput}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.eyeIconToggle}
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  className={styles.eyeIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg
                  className={styles.eyeIcon}
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className={styles.loginBtn}>
            LOGIN
          </button>
        </form>

        <button type="button" className={styles.forgotPassword}>
          Forgot Password ?
        </button>

        <p className={styles.registerText}>
          Don't have an account?
          <Link to="/register" className={styles.registerLink}>
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
