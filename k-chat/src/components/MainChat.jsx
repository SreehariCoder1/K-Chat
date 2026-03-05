import styles from "../styles/MainChat.module.css";
import { Send, PanelLeftOpen } from "lucide-react";

const MainChat = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={styles.mainChat}>
      {!isOpen && (
        <button
          className={styles.openSidebarBtn}
          onClick={toggleSidebar}
          title="Open Sidebar"
        >
          <PanelLeftOpen className={styles.toggleBtn} size={24} />
        </button>
      )}
      <div className={styles.content}>
        <h2 className={styles.welcomeTitle}>Welcome to K-Chat!</h2>
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="Type a message..."
          />
        </div>
        <button className={styles.sendBtn}>
          <Send className={styles.sendIcon} size={20} />
        </button>
      </div>
    </div>
  );
};

export default MainChat;
