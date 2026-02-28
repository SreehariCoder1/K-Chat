import { Link } from "react-router-dom";
import styles from "../styles/RegistrationSuccess.module.css";

const RegistrationSuccess = ({ message }) => {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.tickIcon}
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 className={styles.title}>Registration Successful!</h3>
      <p className={styles.text}>{message}</p>
      <Link to="/login" className={styles.button}>
        Go to Login
      </Link>
    </div>
  );
};

export default RegistrationSuccess;
