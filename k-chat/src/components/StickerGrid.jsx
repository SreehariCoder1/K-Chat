import { Loader2 } from "lucide-react";
import StickerItem from "./StickerItem.jsx";
import styles from "../styles/StickerPicker.module.css";

const StickerGrid = ({
  isLoading,
  stickers,
  activeTab,
  showUploadForm,
  handleSend,
  handleFavorite,
  handleDelete,
}) => {
  return (
    <div className={styles.stickerGrid}>
      {isLoading ? (
        <div className={styles.loaderContainer}>
          <Loader2 className={styles.spinner} size={24} />
        </div>
      ) : stickers.length === 0 ? (
        <div className={styles.emptyState}>
          {activeTab === "recents" && "No recent stickers"}
          {activeTab === "favorites" && "No favorite stickers"}
          {activeTab === "search" && "Search for stickers"}
          {activeTab === "myUploads" &&
            !showUploadForm &&
            "You haven't uploaded any stickers yet"}
        </div>
      ) : (
        stickers.map((sticker) => (
          <StickerItem
            key={sticker._id}
            sticker={sticker}
            activeTab={activeTab}
            handleSend={handleSend}
            handleFavorite={handleFavorite}
            handleDelete={handleDelete}
          />
        ))
      )}
    </div>
  );
};

export default StickerGrid;
