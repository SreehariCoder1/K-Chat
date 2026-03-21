import { useContext, useState } from "react";
import { SettingsContext } from "../context/SettingsContext";
import { AuthContext } from "../context/AuthContext";
import styles from "../styles/SettingsMenu.module.css";
import { X, Volume2, VolumeX, Info, LogOut, Trash2 } from "lucide-react";

const SettingsMenu = ({ onClose }) => {
  const {
    soundEnabled,
    setSoundEnabled,
    incomingMessageSound,
    setIncomingMessageSound,
    senderEffectSound,
    setSenderEffectSound,
    receiverEffectSound,
    setReceiverEffectSound,
  } = useContext(SettingsContext);

  const { logout, deleteAccount } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );
    if (!confirm) return;

    setIsDeleting(true);
    const res = await deleteAccount();
    setIsDeleting(false);

    if (res && !res.success) {
      alert(res.message);
    } else {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X className={styles.settingsIcons} size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Sound Settings */}
          <section className={styles.section}>
            <h3>
              {soundEnabled ? (
                <Volume2 className={styles.settingsIcons} size={18} />
              ) : (
                <VolumeX className={styles.settingsIcons} size={18} />
              )}
              Sound Control
            </h3>

            <div className={styles.settingRow}>
              <span>Master Sound</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingRow}>
              <span>Incoming Message Sound</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={incomingMessageSound}
                  onChange={(e) => setIncomingMessageSound(e.target.checked)}
                  disabled={!soundEnabled}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingRow}>
              <span>Sender Effect Sound</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={senderEffectSound}
                  onChange={(e) => setSenderEffectSound(e.target.checked)}
                  disabled={!soundEnabled}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            <div className={styles.settingRow}>
              <span>Receiver Effect Sound</span>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={receiverEffectSound}
                  onChange={(e) => setReceiverEffectSound(e.target.checked)}
                  disabled={!soundEnabled}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </section>

          {/* About Section */}
          <section className={styles.section}>
            <h3>
              <Info className={styles.settingsIcons} size={18} />
              About
            </h3>
            <div className={styles.aboutContent}>
              <p>
                <strong>K-Chat</strong> is a real-time chat application
                connecting you with friends easily.
              </p>
              <p>Version: 1.0.0 (Web Edition)</p>
              <p>Contact: ambilidileep09@gmail.com</p>
              <p className={styles.copyright}>
                &copy; {new Date().getFullYear()} K-Chat. All rights reserved.
              </p>
            </div>
          </section>

          {/* Account Actions */}
          <section className={styles.actionSection}>
            <button
              className={`${styles.actionBtn} ${styles.dangerBtn}`}
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Trash2 className={styles.settingsIcons} size={18} />
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
            <button
              className={`${styles.actionBtn} ${styles.logoutBtn}`}
              onClick={handleLogout}
            >
              <LogOut className={styles.settingsIcons} size={18} />
              Logout
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
