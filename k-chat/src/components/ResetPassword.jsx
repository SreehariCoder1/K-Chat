import { useState, useContext, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import zxcvbn from "zxcvbn";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/Register.module.css";
import loginStyles from "../styles/Login.module.css";
import bgStyles from "../styles/backgroundAnimation.module.css";
import Loader from "./Loader";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword, error, setError } = useContext(AuthContext);

  useEffect(() => {
    if (setError) setError(null);
  }, [setError]);

  const passwordStrength = useMemo(() => {
    return formData.password ? zxcvbn(formData.password) : null;
  }, [formData.password]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters long");
      return;
    }

    if (formData.password.length > 128) {
      setFormError("Password cannot exceed 128 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(token, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      navigate("/login");
    }
  };

  return (
    <div className={styles.container}>
      <div className={bgStyles.bg}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg2}`}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg3}`}></div>

      <div className={loginStyles.card}>
        <div className={styles.logoContainer}>
          <span className={styles.palmTree}>🌴</span>
          <span className={styles.logoText}>K-Chat</span>
        </div>
        <p className={styles.subtitle}>Set your new password</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.errorText}>{error}</p>}
          {formError && <p className={styles.errorText}>{formError}</p>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 8 characters"
                className={`${styles.input} ${styles.passwordInput}`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className={styles.eyeIconToggle}
                onClick={togglePasswordVisibility}
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
            {formData.password && passwordStrength && (
              <div className={styles.strengthMeterContainer}>
                <div className={styles.strengthMeterBar}>
                  <div
                    className={`${styles.strengthMeterFill} ${styles[`strength${passwordStrength.score}`]}`}
                    style={{
                      width: `${passwordStrength.score !== 0 || formData.password.length > 0 ? (passwordStrength.score + 1) * 20 : 0}%`,
                    }}
                  ></div>
                </div>
                <p
                  className={`${styles.strengthText} ${styles[`textStrength${passwordStrength.score}`]}`}
                >
                  {
                    ["Very Weak", "Weak", "Fair", "Good", "Strong"][
                      passwordStrength.score
                    ]
                  }
                </p>
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm New Password</label>
            <div className={styles.inputWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm your new password"
                className={`${styles.input} ${styles.passwordInput}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className={styles.eyeIconToggle}
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? (
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
          </div>

          {isSubmitting ? (
            <div className={styles.loaderPlaceholder}>
              <Loader />
            </div>
          ) : (
            <button type="submit" className={styles.registerBtn}>
              RESET PASSWORD
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
