import { Clock, Star, Search, Library, X } from "lucide-react";
import styles from "../styles/StickerPicker.module.css";

const StickerTabs = ({ activeTab, setActiveTab, onClose }) => {
  return (
    <div className={styles.header}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "recents" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("recents")}
          title="Recents"
        >
          <Clock className={styles.clockIcon} size={20} />
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "favorites" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("favorites")}
          title="Favorites"
        >
          <Star className={styles.starIcon} size={20} />
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "search" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("search")}
          title="Search"
        >
          <Search className={styles.tabSearchIcon} size={20} />
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "myUploads" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("myUploads")}
          title="My Uploads"
        >
          <Library className={styles.libraryIcon} size={20} />
        </button>
      </div>
      <button className={styles.closeBtn} onClick={onClose}>
        <X className={styles.tabCloseIcon} size={20} />
      </button>
    </div>
  );
};

export default StickerTabs;
