import React, { useContext } from "react";
import styles from "../styles/Sidebar.module.css";
import { User, Filter, List, Search, Inbox, Heart, Power } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.treeIcon}>🌴</span>
        <span>K-Chat</span>
      </div>

      <div className={styles.tabs}>
        <div className={`${styles.tab} ${styles.active}`}>1 on 1 Chat</div>
        <div className={styles.tab}>Rooms</div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionItem}>
          <User className={styles.icon} />
          <span>Online</span>
        </div>
        <div className={styles.actionItem}>
          <Filter className={styles.icon} />
          <span>Filter</span>
        </div>
        <div className={styles.actionItem}>
          <List className={styles.icon} />
          <span>History</span>
        </div>
        <div className={styles.actionItem}>
          <Search className={styles.icon} />
          <span>Search</span>
        </div>
        <div className={styles.actionItem}>
          <div style={{ position: "relative" }}>
            <Inbox className={styles.icon} />
            <span className={styles.badge}>24</span>
          </div>
          <span>Inbox</span>
        </div>
        <div className={styles.actionItem}>
          <Heart className={styles.icon} />
          <span>Friends</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentTitle}>ONLINE — 0</div>
        <div className={styles.emptyState}>No one here yet</div>
      </div>

      <div className={styles.footer}>
        <div className={styles.avatar}>
          {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
        </div>
        <div className={styles.userName}>{user?.username || "Guest"}</div>
        <div
          className={styles.logoutBtn}
          onClick={logout}
          style={{ cursor: "pointer" }}
          title="Logout"
        >
          <Power size={20} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
