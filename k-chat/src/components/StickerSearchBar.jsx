import { Search } from "lucide-react";
import styles from "../styles/StickerPicker.module.css";

const StickerSearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <div className={styles.searchBar}>
      <Search size={16} className={styles.searchIcon} />
      <input
        type="text"
        placeholder="Search stickers..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
        autoFocus
      />
    </div>
  );
};

export default StickerSearchBar;
