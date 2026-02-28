import React from "react";
import styles from "../styles/MainChat.module.css";
import { Send } from "lucide-react";

const MainChat = () => {
  return (
    <div className={styles.mainChat}>
      {/* Intentionally omitting the specific header according to user instructions */}

      <div className={styles.content}>
        <div className={styles.welcomeIcon}>🌴</div>
        <h2 className={styles.welcomeTitle}>Welcome to K-Chat!</h2>
        <p className={styles.welcomeSubtitle}>
          Select a Kerala district from the sidebar to join a chat room and
          connect with people from that area.
        </p>
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
