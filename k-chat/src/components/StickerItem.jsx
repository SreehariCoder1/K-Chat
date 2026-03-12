import { Star, X } from "lucide-react";
import styles from "../styles/StickerPicker.module.css";

const StickerItem = ({
  sticker,
  activeTab,
  handleSend,
  handleFavorite,
  handleDelete,
}) => {
  return (
    <div
      className={styles.stickerItem}
      onClick={() => handleSend(sticker)}
      title={sticker.name}
    >
      <img
        src={sticker.url}
        className={styles.stickerImage}
        alt={sticker.name || "Sticker"}
        loading="lazy"
      />

      <div className={styles.stickerHoverOverlay}>
        {activeTab !== "favorites" && activeTab !== "recents" && (
          <button
            className={styles.overlayActionBtn}
            onClick={(e) => handleFavorite(e, sticker)}
            title="Favorite"
          >
            <Star className={styles.overlayActionBtnStar} size={14} />
          </button>
        )}
        {activeTab === "favorites" && (
          <button
            className={styles.overlayActionBtn}
            onClick={(e) => handleFavorite(e, sticker)}
            title="Remove from favorites"
          >
            <X className={styles.overlayActionBtnX} size={14} />
          </button>
        )}
        {activeTab === "myUploads" && (
          <button
            className={styles.overlayActionBtnDelete}
            onClick={(e) => handleDelete(e, sticker)}
            title="Delete Upload"
          >
            <X className={styles.overlayActionBtnDeleteX} size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default StickerItem;
