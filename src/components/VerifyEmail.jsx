import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import styles from "../styles/VerifyEmail.module.css";
import bgStyles from "../styles/backgroundAnimation.module.css";

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.post(`/auth/verify-email/${token}`);
        setStatus("success");
        setMessage(response.data.message);
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Verification failed. Please try again.",
        );
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  return (
    <div className={styles.verifyContainer}>
      <div className={bgStyles.bg}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg2}`}></div>
      <div className={`${bgStyles.bg} ${bgStyles.bg3}`}></div>

      <div className={styles.verifyCard}>
        {status === "verifying" && (
          <>
            <div className={styles.spinner}></div>
            <h2>Verifying Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Email Verified!</h2>
            <p className={styles.successText}>
              Your email address has been successfully verified. You can now log
              into your account.
            </p>
            <Link to="/login" className={styles.loginBtn}>
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.errorTitle}>Verification Failed</h2>
            <p className={styles.successText}>{message}</p>
            <Link to="/register" className={styles.loginBtn}>
              Back to Registration
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
