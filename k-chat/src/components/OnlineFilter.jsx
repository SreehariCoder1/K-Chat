import PropTypes from "prop-types";
import styles from "../styles/OnlineFilter.module.css";

const OnlineFilter = ({ filters, setFilters }) => {
  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterRow}>
        <select
          className={styles.filterSelect}
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
        >
          <option value="all">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value })}
        >
          <option value="all">All Districts</option>
          <option value="Thiruvananthapuram">Thiruvananthapuram</option>
          <option value="Kollam">Kollam</option>
          <option value="Pathanamthitta">Pathanamthitta</option>
          <option value="Alappuzha">Alappuzha</option>
          <option value="Kottayam">Kottayam</option>
          <option value="Idukki">Idukki</option>
          <option value="Ernakulam">Ernakulam</option>
          <option value="Thrissur">Thrissur</option>
          <option value="Palakkad">Palakkad</option>
          <option value="Malappuram">Malappuram</option>
          <option value="Kozhikode">Kozhikode</option>
          <option value="Wayanad">Wayanad</option>
          <option value="Kannur">Kannur</option>
          <option value="Kasaragod">Kasaragod</option>
        </select>
      </div>
      <div className={styles.filterRow}>
        <input
          type="number"
          placeholder="Min Age"
          className={styles.filterInput}
          value={filters.ageMin}
          onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
          min="13"
          max="120"
        />
        <input
          type="number"
          placeholder="Max Age"
          className={styles.filterInput}
          value={filters.ageMax}
          onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
          min="13"
          max="120"
        />
        <button
          className={styles.clearFilterBtn}
          onClick={() =>
            setFilters({
              gender: "all",
              ageMin: "",
              ageMax: "",
              district: "all",
            })
          }
        >
          Clear
        </button>
      </div>
    </div>
  );
};

OnlineFilter.propTypes = {
  filters: PropTypes.shape({
    gender: PropTypes.string.isRequired,
    ageMin: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    ageMax: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    district: PropTypes.string.isRequired,
  }).isRequired,
  setFilters: PropTypes.func.isRequired,
};

export default OnlineFilter;
