import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/Login.module.css";
import bgStyles from "../styles/backgroundAnimation.module.css";
import RegistrationSuccess from "./RegistrationSuccess";
import Loader from "./Loader";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { forgotPassword, error, setError } = useContext(AuthContext);

  useEffect(() => {
    if (setError) setError(null);
  }, [setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await forgotPassword(email);
    setIsSubmitting(false);

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
        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <span className={styles.palmTree}>🌴</span>
            <span className={styles.logoText}>K-Chat</span>
          </div>
          <p className={styles.subtitle}>
            Enter your email to receive a password reset link.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <p className={styles.errorText}> {error} </p>}

            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="you@example.com"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {isSubmitting ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Loader />
              </div>
            ) : (
              <button type="submit" className={styles.loginBtn}>
                SEND RESET LINK
              </button>
            )}
          </form>

          <p className={styles.registerText}>
            Remember your password?
            <Link to="/login" className={styles.registerLink}>
              Login Here
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
