import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import axios from "axios";
import styles from "../styles/StickerPicker.module.css";
import StickerTabs from "./StickerTabs.jsx";
import StickerSearchBar from "./StickerSearchBar.jsx";
import StickerUploadForm from "./StickerUploadForm.jsx";
import StickerGrid from "./StickerGrid.jsx";

const StickerPicker = ({ onClose, onSendSticker }) => {
  const [activeTab, setActiveTab] = useState("recents"); // 'recents', 'favorites', 'search', 'myUploads'
  const [stickers, setStickers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastKey, setToastKey] = useState(0);

  // Upload Form State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadKeywords, setUploadKeywords] = useState("");

  const activeTabRef = useRef(activeTab);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    activeTabRef.current = activeTab;
    searchQueryRef.current = searchQuery;
  }, [activeTab, searchQuery]);

  const fetchStickers = async (tab, query = "") => {
    setIsLoading(true);
    setStickers([]);
    try {
      let res;
      if (tab === "recents") {
        res = await axios.get("/stickers/recents");
      } else if (tab === "favorites") {
        res = await axios.get("/stickers/favorites");
      } else if (tab === "search") {
        res = await axios.get(`/stickers?query=${query}`);
      } else if (tab === "myUploads") {
        res = await axios.get("/stickers/my-uploads");
      }

      if (res && res.data) {
        setStickers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch stickers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setShowUploadForm(false);
    fetchStickers(activeTab, searchQueryRef.current);
  }, [activeTab]);

  useEffect(() => {
    if (activeTabRef.current === "search") {
      const delayOp = setTimeout(() => {
        fetchStickers("search", searchQuery);
      }, 500);
      return () => clearTimeout(delayOp);
    }
  }, [searchQuery]);

  const handleSend = async (sticker) => {
    // Optimistically update recents if you're in another tab
    try {
      await axios.post(`/stickers/recents/${sticker._id}`);
    } catch (err) {
      console.error("Failed to add sticker to recents", err);
    }
    onSendSticker(sticker);
    onClose();
  };

  const handleFavorite = async (e, sticker) => {
    e.stopPropagation();
    try {
      if (activeTab === "favorites") {
        await axios.delete(`/stickers/favorites/${sticker._id}`);
        setStickers((prev) => prev.filter((s) => s._id !== sticker._id));
        showToast("Removed from favorites");
      } else {
        await axios.post(`/stickers/favorites/${sticker._id}`);
        showToast("Added to favorites \u2764\uFE0F");
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      showToast("Failed to update favorites");
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastKey((prev) => prev + 1); // Changing key forces animation to restart
    setTimeout(() => setToastMessage(""), 2000);
  };

  const handleDelete = async (e, sticker) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this sticker?"))
      return;

    try {
      await axios.delete(`/stickers/${sticker._id}`);
      setStickers((prev) => prev.filter((s) => s._id !== sticker._id));
    } catch (err) {
      console.error("Failed to delete sticker", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/webp") {
      setUploadError("Only .webp files are allowed.");
      setUploadFile(null);
      return;
    }

    setUploadError("");
    setUploadFile(file);
    if (!uploadName) {
      setUploadName(file.name.replace(".webp", ""));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadName) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("sticker", uploadFile);
    formData.append("name", uploadName);
    formData.append("keywords", uploadKeywords);

    const isLikelyAnimated = uploadFile.size > 90 * 1024;
    const type = isLikelyAnimated ? "animated" : "static";
    formData.append("type", type);

    try {
      const res = await fetch(
        `http://${window.location.hostname}:5000/api/stickers/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include", // Needed for jwt cookie
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      setShowUploadForm(false);
      setUploadFile(null);
      setUploadName("");
      setUploadKeywords("");
      if (activeTab === "myUploads") {
        fetchStickers("myUploads");
      } else {
        setActiveTab("myUploads");
      }
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.pickerContainer}>
      {toastMessage && (
        <div key={toastKey} className={styles.toast}>
          {toastMessage}
        </div>
      )}

      <StickerTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onClose={onClose}
      />

      {activeTab === "search" && (
        <StickerSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {activeTab === "myUploads" && !showUploadForm && (
        <button
          className={styles.uploadTriggerBtn}
          onClick={() => setShowUploadForm(true)}
        >
          <Plus className={styles.uploadTriggerBtnPlus} size={16} /> Upload New
          Sticker
        </button>
      )}

      {showUploadForm && (
        <StickerUploadForm
          handleUploadSubmit={handleUploadSubmit}
          handleFileChange={handleFileChange}
          uploadFile={uploadFile}
          uploadName={uploadName}
          setUploadName={setUploadName}
          uploadKeywords={uploadKeywords}
          setUploadKeywords={setUploadKeywords}
          uploadError={uploadError}
          setShowUploadForm={setShowUploadForm}
          isUploading={isUploading}
        />
      )}

      <StickerGrid
        isLoading={isLoading}
        stickers={stickers}
        activeTab={activeTab}
        showUploadForm={showUploadForm}
        handleSend={handleSend}
        handleFavorite={handleFavorite}
        handleDelete={handleDelete}
      />
    </div>
  );
};

export default StickerPicker;
