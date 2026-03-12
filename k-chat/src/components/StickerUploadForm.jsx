import { Loader2 } from "lucide-react";
import styles from "../styles/StickerPicker.module.css";

const StickerUploadForm = ({
  handleUploadSubmit,
  handleFileChange,
  uploadFile,
  uploadName,
  setUploadName,
  uploadKeywords,
  setUploadKeywords,
  uploadError,
  setShowUploadForm,
  isUploading,
}) => {
  return (
    <form className={styles.uploadForm} onSubmit={handleUploadSubmit}>
      <h4>Upload Sticker</h4>

      <input
        type="file"
        accept="image/webp"
        onChange={handleFileChange}
        className={styles.fileInput}
        id="sticker-file"
      />
      <label htmlFor="sticker-file" className={styles.fileLabel}>
        {uploadFile ? uploadFile.name : "Choose .webp file"}
      </label>
      <p className={styles.uploadHint}>
        Static: up to 100KB, Animated: up to 500KB
      </p>

      <input
        type="text"
        placeholder="Sticker Name"
        value={uploadName}
        onChange={(e) => setUploadName(e.target.value)}
        className={styles.uploadInput}
        required
      />
      <input
        type="text"
        placeholder="Keywords (comma separated)"
        value={uploadKeywords}
        onChange={(e) => setUploadKeywords(e.target.value)}
        className={styles.uploadInput}
      />

      {uploadError && <p className={styles.errorText}>{uploadError}</p>}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={() => setShowUploadForm(false)}
          className={styles.cancelBtn}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!uploadFile || isUploading}
          className={styles.submitBtn}
        >
          {isUploading ? (
            <Loader2 size={16} className={styles.spinner} />
          ) : (
            "Upload"
          )}
        </button>
      </div>
    </form>
  );
};

export default StickerUploadForm;
