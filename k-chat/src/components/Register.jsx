import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import zxcvbn from "zxcvbn";
import { AuthContext } from "../context/AuthContext";
import RegistrationSuccess from "./RegistrationSuccess";
import Loader from "./Loader";
import styles from "../styles/Register.module.css";
import bgStyles from "../styles/backgroundAnimation.module.css";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    gender: "",
    age: "",
    district: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const { register, error, setError } = useContext(AuthContext);

  useEffect(() => {
    if (setError) setError(null);
  }, [setError]);

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(zxcvbn(formData.password));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.password]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.username.length < 3) {
      setFormError("Username must be at least 3 characters long");
      return;
    }

    if (formData.username.length > 30) {
      setFormError("Username cannot exceed 30 characters");
      return;
    }

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

    setIsRegistering(true);
    const result = await register(formData);
    setIsRegistering(false);

    if (result.success) {
      setSuccessMessage(result.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={bgStyles.bg}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg2}`}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg3}`}></div>
      {successMessage ? (
        <RegistrationSuccess message={successMessage} />
      ) : (
        <>
          <div className={styles.card}>
            <div className={styles.logoContainer}>
              <span className={styles.palmTree}>🌴</span>
              <span className={styles.logoText}>K-Chat</span>
            </div>
            <p className={styles.subtitle}>
              Create an account and start chatting
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              {error && <p className={styles.errorText}>{error}</p>}
              {formError && <p className={styles.errorText}>{formError}</p>}
              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    name="username"
                    placeholder="Choose a username"
                    className={styles.input}
                    value={formData.username}
                    onChange={handleChange}
                    minLength={3}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Gender</label>
                  <div className={styles.inputWrapper}>
                    <select
                      name="gender"
                      className={`${styles.input} ${styles.select}`}
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Age</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="number"
                      name="age"
                      placeholder="Your age"
                      className={styles.input}
                      min="13"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>District</label>
                <div className={styles.inputWrapper}>
                  <select
                    name="district"
                    className={`${styles.input} ${styles.select}`}
                    value={formData.district}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select your district
                    </option>
                    <option value="thiruvananthapuram">
                      Thiruvananthapuram
                    </option>
                    <option value="kollam">Kollam</option>
                    <option value="pathanamthitta">Pathanamthitta</option>
                    <option value="alappuzha">Alappuzha</option>
                    <option value="kottayam">Kottayam</option>
                    <option value="idukki">Idukki</option>
                    <option value="ernakulam">Ernakulam</option>
                    <option value="thrissur">Thrissur</option>
                    <option value="palakkad">Palakkad</option>
                    <option value="malappuram">Malappuram</option>
                    <option value="kozhikode">Kozhikode</option>
                    <option value="wayanad">Wayanad</option>
                    <option value="kannur">Kannur</option>
                    <option value="kasaragod">Kasaragod</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className={styles.input}
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Create Password</label>
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
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
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
                  <label className={styles.label}>Confirm Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm your password"
                      className={`${styles.input} ${styles.passwordInput}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeIconToggle}
                      onClick={toggleConfirmPasswordVisibility}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
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
              </div>
              {isRegistering ? (
                <div className={styles.loaderPlaceholder}>
                  <Loader />
                </div>
              ) : (
                <button
                  type="submit"
                  className={styles.registerBtn}
                  disabled={isRegistering}
                >
                  REGISTER
                </button>
              )}
            </form>

            <p className={styles.loginText}>
              Already have an account?
              <Link to="/login" className={styles.loginLink}>
                Login
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Register;
