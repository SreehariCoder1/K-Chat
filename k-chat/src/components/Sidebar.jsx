import { useContext, useState, useEffect } from "react";
import styles from "../styles/Sidebar.module.css";
import typingStyles from "../styles/typingIndicator.module.css";
import {
  User,
  Filter,
  List,
  Search,
  Inbox,
  Heart,
  Power,
  User as UserIcon,
  UserRound,
  UserCircle,
  PanelLeftClose,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

const Sidebar = ({ isOpen, toggleSidebar, selectedUser, setSelectedUser }) => {
  const { user, logout } = useContext(AuthContext);
  const { onlineUsers = [], socket } = useContext(SocketContext);
  const [typingUsers, setTypingUsers] = useState(new Set());

  const otherOnlineUsers = onlineUsers.filter(
    (u) => u._id !== user?.id && u._id !== user?._id,
  );

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ senderId }) => {
      setTypingUsers((prev) => new Set(prev).add(senderId));
    };

    const handleStopTyping = ({ senderId }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket]);
  return (
    <div className={`${styles.sidebar} ${isOpen ? "" : styles.sidebarClosed}`}>
      <div className={styles.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className={styles.treeIcon}>🌴</span>
          <span>K-Chat</span>
        </div>
        <button
          className={styles.toggleBtn}
          onClick={toggleSidebar}
          title="Close Sidebar"
        >
          <PanelLeftClose className={styles.toggleIcon} size={20} />
        </button>
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
          <div style={{ position: "relative", display: "flex" }}>
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
        <div className={styles.contentTitle}>
          ONLINE — {otherOnlineUsers.length}
        </div>
        {otherOnlineUsers.length === 0 ? (
          <div className={styles.emptyState}>No one here yet</div>
        ) : (
          <div className={styles.onlineList}>
            {otherOnlineUsers.map((u, idx) => {
              const bgClass =
                u.gender === "female"
                  ? styles.femaleBg
                  : u.gender === "other"
                    ? styles.otherBg
                    : styles.maleBg;

              const AvatarIcon =
                u.gender === "female"
                  ? UserRound
                  : u.gender === "other"
                    ? UserCircle
                    : UserIcon;

              const isSelected = selectedUser?._id === u._id;
              const isTyping = typingUsers.has(u._id);

              return (
                <div
                  key={`${u._id}-${idx}`}
                  className={`${styles.onlineUserRow} ${bgClass}`}
                  onClick={() => {
                    setSelectedUser(u);
                    if (window.innerWidth <= 500) {
                      toggleSidebar();
                    }
                  }}
                  style={{
                    border: isSelected
                      ? "2px solid #fff"
                      : "2px solid transparent",
                  }}
                >
                  {isTyping && (
                    <div
                      className={`${typingStyles.typingIndicator} ${typingStyles.sidebarPosition}`}
                      title="Typing..."
                    >
                      <span className={typingStyles.dot}></span>
                      <span className={typingStyles.dot}></span>
                      <span className={typingStyles.dot}></span>
                    </div>
                  )}
                  <div className={styles.userIconWrapper}>
                    <AvatarIcon
                      className={styles.userIconSolid}
                      fill="currentColor"
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userNameText}>{u.username}</div>
                    <div className={styles.userDetails}>
                      {u.age} Yrs, {u.district}, Kerala
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
          <Power className={styles.logoutIcon} size={20} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
