import { useContext, useState, useEffect } from "react";
import axios from "axios";
import styles from "../styles/Sidebar.module.css";
import typingStyles from "../styles/typingIndicator.module.css";
import { formatDateLabel, formatTime } from "../utils/dateUtils";
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
  Ban,
  MoreHorizontal,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

const Sidebar = ({ isOpen, toggleSidebar, selectedUser, setSelectedUser }) => {
  const { user, logout, blockUser, unblockUser } = useContext(AuthContext);
  const { onlineUsers = [], socket } = useContext(SocketContext);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState("online");
  const [historyUsers, setHistoryUsers] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const otherOnlineUsers = onlineUsers.filter(
    (u) => u._id !== user?.id && u._id !== user?._id,
  );

  const fetchHistory = () => {
    axios
      .get("/messages/history")
      .then((res) => {
        setHistoryUsers(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch history:", err);
      });
  };

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

    const handleReceiveMessage = (message) => {
      if (!user) return;
      const currentUserId = user.id || user._id;

      setHistoryUsers((prev) => {
        // Find if the person you messaged/received from is already in history
        const otherUserId =
          message.senderId === currentUserId
            ? message.receiverId
            : message.senderId;

        const existingUserIdx = prev.findIndex((u) => u._id === otherUserId);

        let newHistory = [...prev];

        if (existingUserIdx !== -1) {
          // User already in history, update their time and move to top
          const updatedUser = {
            ...newHistory[existingUserIdx],
            lastMessageTime: message.createdAt,
          };
          newHistory.splice(existingUserIdx, 1);
          newHistory.unshift(updatedUser);
        } else {
          fetchHistory();
          return prev;
        }

        return newHistory;
      });
    };

    const handleLocalMessageSent = (e) => {
      handleReceiveMessage(e.detail);
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("receiveMessage", handleReceiveMessage);
    window.addEventListener("localMessageSent", handleLocalMessageSent);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("receiveMessage", handleReceiveMessage);
      window.removeEventListener("localMessageSent", handleLocalMessageSent);
    };
  }, [socket, user]);

  useEffect(() => {
    if (activeTab === "history") {
      axios
        .get("/messages/history")
        .then((res) => {
          setHistoryUsers(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch history:", err);
        })
        .finally(() => {
          setLoadingHistory(false);
        });
    } else if (activeTab === "blocked") {
      axios
        .get("/users/blocked")
        .then((res) => {
          setBlockedUsersList(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch blocked users:", err);
        })
        .finally(() => {
          setLoadingBlocked(false);
        });
    }
  }, [activeTab]);

  return (
    <div className={`${styles.sidebar} ${isOpen ? "" : styles.sidebarClosed}`}>
      <div className={styles.header}>
        <div className={styles.headerLogoContainer}>
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
        <div
          className={`${styles.actionItem} ${activeTab === "online" ? styles.activeAction : ""}`}
          onClick={() => setActiveTab("online")}
        >
          <User className={styles.icon} />
          <span>Online</span>
        </div>
        <div className={styles.actionItem}>
          <Filter className={styles.icon} />
          <span>Filter</span>
        </div>
        <div
          className={`${styles.actionItem} ${activeTab === "history" ? styles.activeAction : ""}`}
          onClick={() => {
            setActiveTab("history");
            if (activeTab !== "history") setLoadingHistory(true);
          }}
        >
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
        <div
          className={`${styles.actionItem} ${activeTab === "blocked" ? styles.activeAction : ""}`}
          onClick={() => {
            setActiveTab("blocked");
            if (activeTab !== "blocked") setLoadingBlocked(true);
          }}
        >
          <Ban className={styles.icon} />
          <span>Blocked</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentTitle}>
          {activeTab === "online"
            ? `ONLINE \u2014 ${otherOnlineUsers.length}`
            : activeTab === "history"
              ? `ONLINE \u2014 ${historyUsers.filter((hu) => otherOnlineUsers.some((ou) => ou._id === hu._id)).length}`
              : `BLOCKED \u2014 ${blockedUsersList.length}`}
        </div>
        {activeTab === "history" && loadingHistory ? (
          <div className={styles.emptyState}>Loading history...</div>
        ) : activeTab === "blocked" && loadingBlocked ? (
          <div className={styles.emptyState}>Loading blocked users...</div>
        ) : activeTab === "online" && otherOnlineUsers.length === 0 ? (
          <div className={styles.emptyState}>No one online right now</div>
        ) : activeTab === "history" && historyUsers.length === 0 ? (
          <div className={styles.emptyState}>No chat history yet</div>
        ) : activeTab === "blocked" && blockedUsersList.length === 0 ? (
          <div className={styles.emptyState}>No blocked users</div>
        ) : (
          <div className={styles.onlineList}>
            {(activeTab === "history"
              ? historyUsers
              : activeTab === "blocked"
                ? blockedUsersList
                : otherOnlineUsers
            ).map((u, idx) => {
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
              const isUserOnline = otherOnlineUsers.some(
                (ou) => ou._id === u._id,
              );
              const isBlocked = user?.blockedUsers?.includes(u._id);

              let displayTime = "";
              if (activeTab === "history" && u.lastMessageTime) {
                const dateLabel = formatDateLabel(u.lastMessageTime);
                if (dateLabel === "Today") {
                  displayTime = formatTime(u.lastMessageTime);
                } else {
                  displayTime = dateLabel;
                }
              }

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
                    position: "relative",
                  }}
                >
                  {activeTab === "history" && (
                    <div
                      className={styles.onlineIndicator}
                      style={{
                        backgroundColor: isUserOnline ? "#4ade80" : "#9ca3af",
                      }}
                      title={isUserOnline ? "Online" : "Offline"}
                    />
                  )}
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
                  {isBlocked && (
                    <div
                      className={styles.blockedIndicator}
                      title="Blocked User"
                    >
                      <Ban
                        className={styles.blockIcon}
                        size={16}
                        color="#ef4444"
                      />
                    </div>
                  )}
                  <div className={styles.userIconWrapper}>
                    <AvatarIcon
                      className={styles.userIconSolid}
                      fill="currentColor"
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <div>
                      <div className={styles.userNameText}>{u.username}</div>
                      <div className={styles.userDetails}>
                        {u.age} Yrs, {u.district}, Kerala
                      </div>
                    </div>
                    {activeTab === "history" && displayTime && (
                      <div className={styles.time}>{displayTime}</div>
                    )}
                  </div>
                  <button
                    className={styles.moreIconBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(
                        openDropdownId === u._id ? null : u._id,
                      );
                    }}
                  >
                    <MoreHorizontal className={styles.moreIcon} size={18} />
                  </button>

                  {openDropdownId === u._id && (
                    <div className={styles.contextMenu}>
                      <div
                        className={`${styles.contextMenuItem} ${isBlocked ? styles.textUnblock : styles.textBlock}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isBlocked) {
                            unblockUser(u._id).then((res) => {
                              if (
                                res &&
                                res.success &&
                                activeTab === "blocked"
                              ) {
                                setBlockedUsersList((prev) =>
                                  prev.filter((usr) => usr._id !== u._id),
                                );
                              }
                            });
                          } else {
                            blockUser(u._id);
                          }
                          setOpenDropdownId(null);
                        }}
                      >
                        {isBlocked ? "Unblock" : "Block"}
                      </div>
                    </div>
                  )}
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
        <div className={styles.logoutBtn} onClick={logout} title="Logout">
          <Power className={styles.logoutIcon} size={20} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
