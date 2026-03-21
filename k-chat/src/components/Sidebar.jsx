import { useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "../styles/Sidebar.module.css";
import typingStyles from "../styles/typingIndicator.module.css";
import { formatDateLabel, formatTime } from "../utils/dateUtils";
import {
  User,
  Filter,
  List,
  Search,
  Dices,
  Heart,
  Power,
  User as UserIcon,
  UserRound,
  UserCircle,
  PanelLeftClose,
  Ban,
  MoreHorizontal,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import { ThemeContext } from "../context/ThemeContext";
import OnlineFilter from "./OnlineFilter";
import RandomChat from "./RandomChat";
import { playNotificationSound } from "../utils/notificationSound";
import SettingsMenu from "./SettingsMenu";

const Sidebar = ({ isOpen, toggleSidebar, selectedUser, setSelectedUser }) => {
  const { user, blockUser, unblockUser } = useContext(AuthContext);
  const { onlineUsers = [], socket } = useContext(SocketContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [activeTab, setActiveTab] = useState("online");
  const [historyUsers, setHistoryUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [favoritesList, setFavoritesList] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: "all",
    ageMin: "",
    ageMax: "",
    district: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  const filteredOnlineUsers = otherOnlineUsers.filter((u) => {
    if (filters.gender !== "all" && u.gender !== filters.gender) return false;
    if (filters.ageMin && u.age < parseInt(filters.ageMin, 10)) return false;
    if (filters.ageMax && u.age > parseInt(filters.ageMax, 10)) return false;
    if (
      filters.district !== "all" &&
      u.district?.toLowerCase() !== filters.district.toLowerCase()
    )
      return false;
    return true;
  });

  const fetchHistory = useCallback(() => {
    axios
      .get("/messages/history")
      .then((res) => {
        setHistoryUsers(res.data);
        setUnreadCounts((prev) => {
          const uc = { ...prev };
          res.data.forEach((u) => {
            if (u.unreadCount !== undefined) {
              uc[u._id] = u.unreadCount;
            }
          });
          return uc;
        });
      })
      .catch((err) => {
        console.error("Failed to fetch history:", err);
      });
  }, []);

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

      let isHidden = false;
      if (typeof document !== "undefined" && document.hidden) {
        isHidden = true;
      }
      // Check if mobile view is hiding main chat
      const isMobile = window.matchMedia("(max-width: 501px)").matches;
      if (isMobile && isOpen) {
        isHidden = true; // Chat is not visible because sidebar is open on mobile
      }

      if (message.senderId !== currentUserId) {
        const isForSelectedUser =
          selectedUser && selectedUser._id === message.senderId;

        // Increment unread count
        if (!isForSelectedUser || isHidden) {
          setUnreadCounts((prev) => ({
            ...prev,
            [message.senderId]: (prev[message.senderId] || 0) + 1,
          }));

          if (!user.blockedUsers?.includes(message.senderId)) {
            playNotificationSound();
          }
        }
      }

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

    const handleMessagesRead = ({ senderId }) => {
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[senderId];
        return next;
      });
    };

    socket.on("connect", fetchHistory);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messagesRead", handleMessagesRead);
    window.addEventListener("localMessageSent", handleLocalMessageSent);

    return () => {
      socket.off("connect", fetchHistory);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messagesRead", handleMessagesRead);
      window.removeEventListener("localMessageSent", handleLocalMessageSent);
    };
  }, [socket, user, selectedUser, isOpen, unreadCounts, fetchHistory]);

  useEffect(() => {
    if (activeTab === "history") {
      axios
        .get("/messages/history")
        .then((res) => {
          setHistoryUsers(res.data);
          setUnreadCounts((prev) => {
            const uc = { ...prev };
            res.data.forEach((u) => {
              if (u.unreadCount !== undefined) {
                uc[u._id] = u.unreadCount;
              }
            });
            return uc;
          });
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
    } else if (activeTab === "favorites") {
      axios
        .get("/users/favorites")
        .then((res) => {
          setFavoritesList(res.data);
        })
        .catch((err) => {
          console.error("Failed to fetch favorite users:", err);
        })
        .finally(() => {
          setLoadingFavorites(false);
        });
    }
  }, [activeTab]);

  useEffect(() => {
    let delayFn;

    const fetchSearchResults = async () => {
      try {
        const res = await axios.get(
          `/users/search?q=${encodeURIComponent(searchQuery)}`,
        );
        setSearchResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    };

    if (activeTab === "search" && searchQuery.trim() !== "") {
      delayFn = setTimeout(() => {
        fetchSearchResults();
      }, 500);
    }

    return () => {
      if (delayFn) clearTimeout(delayFn);
    };
  }, [searchQuery, activeTab]);

  const totalUnreadCount = Object.keys(unreadCounts).reduce(
    (acc, currentId) => {
      if (!user?.blockedUsers?.includes(currentId)) {
        return acc + (unreadCounts[currentId] || 0);
      }
      return acc;
    },
    0,
  );

  return (
    <div className={`${styles.sidebar} ${isOpen ? "" : styles.sidebarClosed}`}>
      <div className={styles.header}>
        <div className={styles.headerLogoContainer}>
          <span className={styles.treeIcon}>🌴</span>
          <span>K-Chat</span>
        </div>
        <div className={styles.headerButtons}>
          <button
            className={styles.toggleBtn}
            onClick={toggleTheme}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className={styles.toggleIcon} size={20} />
            ) : (
              <Sun className={styles.toggleIcon} size={20} />
            )}
          </button>
          <button
            className={styles.toggleBtn}
            onClick={toggleSidebar}
            title="Close Sidebar"
          >
            <PanelLeftClose className={styles.toggleIcon} size={20} />
          </button>
        </div>
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
        <div
          className={`${styles.actionItem} ${activeTab === "history" ? styles.activeAction : ""}`}
          onClick={() => {
            setActiveTab("history");
            if (activeTab !== "history") setLoadingHistory(true);
          }}
        >
          <List className={styles.icon} />
          <span>History</span>
          {totalUnreadCount > 0 && (
            <span className={styles.tabBadge}>{totalUnreadCount}</span>
          )}
        </div>
        <div
          className={`${styles.actionItem} ${activeTab === "favorites" ? styles.activeAction : ""}`}
          onClick={() => {
            setActiveTab("favorites");
            if (activeTab !== "favorites") setLoadingFavorites(true);
          }}
        >
          <Heart className={styles.icon} />
          <span>Favorites</span>
        </div>
        <div
          className={`${styles.actionItem} ${activeTab === "search" ? styles.activeAction : ""}`}
          onClick={() => setActiveTab("search")}
        >
          <Search className={styles.icon} />
          <span>Search</span>
        </div>
        <div
          className={`${styles.actionItem} ${activeTab === "random" ? styles.activeAction : ""}`}
          onClick={() => setActiveTab("random")}
        >
          <Dices className={styles.icon} />
          <span>Random</span>
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
        <div className={styles.contentTitleContainer}>
          <div className={styles.contentTitle}>
            {activeTab === "online"
              ? `ONLINE \u2014 ${filteredOnlineUsers.length}`
              : activeTab === "history"
                ? `ONLINE \u2014 ${historyUsers.filter((hu) => otherOnlineUsers.some((ou) => ou._id === hu._id)).length}`
                : activeTab === "search"
                  ? `SEARCH RESULTS \u2014 ${searchResults.length}`
                  : activeTab === "random"
                    ? "RANDOM CHAT"
                    : activeTab === "favorites"
                      ? `FAVORITES \u2014 ${favoritesList.length}`
                      : `BLOCKED \u2014 ${blockedUsersList.length}`}
          </div>
          {activeTab === "online" && (
            <div
              className={`${styles.filterHeaderIcon} ${showFilters ? styles.filterHeaderIconActive : ""}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Filter Online Users"
            >
              <Filter className={styles.filterIcon} size={16} />
            </div>
          )}
        </div>

        {activeTab === "online" && showFilters && (
          <OnlineFilter filters={filters} setFilters={setFilters} />
        )}

        {activeTab === "search" && (
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by username, gender, district, age..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.trim() !== "") {
                  setIsSearching(true);
                } else {
                  setIsSearching(false);
                  setSearchResults([]);
                }
              }}
              className={styles.searchInput}
            />
          </div>
        )}

        <RandomChat
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          toggleSidebar={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {activeTab === "random" ? null : activeTab === "history" &&
          loadingHistory ? (
          <div className={styles.emptyState}>Loading history...</div>
        ) : activeTab === "blocked" && loadingBlocked ? (
          <div className={styles.emptyState}>Loading blocked users...</div>
        ) : activeTab === "favorites" && loadingFavorites ? (
          <div className={styles.emptyState}>Loading favorite users...</div>
        ) : activeTab === "search" && isSearching ? (
          <div className={styles.emptyState}>Searching...</div>
        ) : activeTab === "search" &&
          searchQuery.trim() !== "" &&
          searchResults.length === 0 ? (
          <div className={styles.emptyState}>No users found</div>
        ) : activeTab === "search" && searchQuery.trim() === "" ? (
          <div className={styles.emptyState}>
            Type to search for users globally
          </div>
        ) : activeTab === "online" && filteredOnlineUsers.length === 0 ? (
          <div className={styles.emptyState}>
            {otherOnlineUsers.length === 0
              ? "No one online right now"
              : "No users match your filters"}
          </div>
        ) : activeTab === "history" && historyUsers.length === 0 ? (
          <div className={styles.emptyState}>No chat history yet</div>
        ) : activeTab === "blocked" && blockedUsersList.length === 0 ? (
          <div className={styles.emptyState}>No blocked users</div>
        ) : activeTab === "favorites" && favoritesList.length === 0 ? (
          <div className={styles.emptyState}>No favorite users</div>
        ) : (
          <div className={styles.onlineList}>
            {(activeTab === "history"
              ? historyUsers
              : activeTab === "blocked"
                ? blockedUsersList
                : activeTab === "favorites"
                  ? favoritesList
                  : activeTab === "search"
                    ? searchResults
                    : filteredOnlineUsers
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
              const isFavorite = user?.favorites?.includes(u._id);

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
                  <div className={styles.avatarContainer}>
                    {activeTab === "history" && (
                      <div
                        className={styles.onlineIndicator}
                        style={{
                          backgroundColor: isUserOnline ? "#4ade80" : "#9ca3af",
                        }}
                        title={isUserOnline ? "Online" : "Offline"}
                      />
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
                    {unreadCounts[u._id] > 0 && !isBlocked && (
                      <div className={styles.unreadBadge}>
                        {unreadCounts[u._id]}
                      </div>
                    )}
                  </div>

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

                  <div className={styles.userInfo}>
                    <div>
                      <div className={styles.userNameText}>
                        {u.username}
                        {isFavorite && (
                          <Heart
                            size={14}
                            color="#ef4444"
                            fill="#ef4444"
                            style={{
                              marginLeft: "0.3em",
                              display: "inline-block",
                              verticalAlign: "middle",
                              marginBottom: "0.15em",
                              width: "0.9rem",
                              height: "0.9rem",
                            }}
                          />
                        )}
                      </div>
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

                      {activeTab === "history" && (
                        <div
                          className={`${styles.contextMenuItem} ${styles.textDelete}`}
                          style={{ color: "#ef4444" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const confirmed = window.confirm(
                              "Are you sure you want to delete this chat history? All messages will be permanently deleted.",
                            );
                            if (confirmed) {
                              axios
                                .delete(`/messages/history/${u._id}`)
                                .then(() => {
                                  setHistoryUsers((prev) =>
                                    prev.filter((usr) => usr._id !== u._id),
                                  );
                                  // if the user was the selected user, un-select them
                                  if (selectedUser?._id === u._id) {
                                    setSelectedUser(null);
                                  }
                                })
                                .catch((err) => {
                                  console.error(
                                    "Failed to delete chat history:",
                                    err,
                                  );
                                  alert("Failed to delete chat history.");
                                });
                            }
                            setOpenDropdownId(null);
                          }}
                        >
                          Delete Chat
                        </div>
                      )}
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
        <div
          className={styles.logoutBtn}
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <Settings className={styles.logoutIcon} size={20} />
        </div>
      </div>

      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Sidebar;
