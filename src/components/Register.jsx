import { useState } from "react";
import styles from "../styles/Register.module.css";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoContainer}>
          <span className={styles.palmTree}>🌴</span>
          <span className={styles.logoText}>K-Chat</span>
        </div>
        <p className={styles.subtitle}>Create an account and start chatting</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Choose a username"
                className={styles.input}
                required
              />
            </div>
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Gender</label>
              <div className={styles.inputWrapper}>
                <select
                  className={`${styles.input} ${styles.select}`}
                  required
                  defaultValue=""
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
                  placeholder="Your age"
                  className={styles.input}
                  min="13"
                  max="120"
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>District</label>
            <div className={styles.inputWrapper}>
              <select
                className={`${styles.input} ${styles.select}`}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select your district
                </option>
                <option value="thiruvananthapuram">Thiruvananthapuram</option>
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
                placeholder="you@example.com"
                className={styles.input}
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
                  placeholder="At least 6 characters"
                  className={`${styles.input} ${styles.passwordInput}`}
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
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Confirm Password</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`${styles.input} ${styles.passwordInput}`}
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

          <button type="submit" className={styles.registerBtn}>
            REGISTER
          </button>
        </form>

        <p className={styles.loginText}>
          Already have an account?
          <button type="button" className={styles.loginLink}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
