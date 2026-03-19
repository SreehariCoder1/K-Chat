import { useContext, useState, useEffect, useRef } from "react";
import styles from "../styles/RandomChat.module.css";
import sidebarStyles from "../styles/Sidebar.module.css";
import {
  User as UserIcon,
  UserRound,
  UserCircle,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

const RandomChat = ({
  selectedUser,
  setSelectedUser,
  toggleSidebar,
  activeTab,
  setActiveTab,
}) => {
  const { user, blockUser, unblockUser } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [randomStatus, setRandomStatus] = useState("idle"); // idle | waiting | matched
  const [randomPartner, setRandomPartner] = useState(null);
  const [waitingCountdown, setWaitingCountdown] = useState(60);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const countdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Countdown timer for waiting state (1 minute)
  useEffect(() => {
    if (randomStatus === "waiting") {
      setWaitingCountdown(60);
      countdownRef.current = setInterval(() => {
        setWaitingCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            socket && socket.emit("leaveRandomPool");
            setRandomStatus("idle");
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [randomStatus]);

  // Socket listeners for random chat
  useEffect(() => {
    if (!socket) return;

    const handleRandomWaiting = () => setRandomStatus("waiting");
    const handleRandomMatched = ({ partner }) => {
      setRandomPartner(partner);
      setRandomStatus("matched");
      setSelectedUser(partner);
    };
    const handleRandomResumed = ({ partner }) => {
      setRandomPartner(partner);
      setRandomStatus("matched");
      setSelectedUser(partner);
      setActiveTab("random");
    };
    const handleRandomPartnerLeft = () => {
      setRandomStatus("idle");
      setRandomPartner((prev) => {
        if (prev) {
          setSelectedUser((sel) => (sel?._id === prev._id ? null : sel));
        }
        return null;
      });
    };

    socket.on("randomWaiting", handleRandomWaiting);
    socket.on("randomMatched", handleRandomMatched);
    socket.on("randomResumed", handleRandomResumed);
    socket.on("randomPartnerLeft", handleRandomPartnerLeft);

    return () => {
      socket.off("randomWaiting", handleRandomWaiting);
      socket.off("randomMatched", handleRandomMatched);
      socket.off("randomResumed", handleRandomResumed);
      socket.off("randomPartnerLeft", handleRandomPartnerLeft);
    };
  }, [socket, setSelectedUser, setActiveTab]);

  // When navigating away from the random tab, leave the pool if waiting
  useEffect(() => {
    if (activeTab !== "random") {
      if (socket && randomStatus === "waiting") {
        socket.emit("leaveRandomPool");
        setRandomStatus("idle");
        setRandomPartner(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (activeTab !== "random") return null;

  return (
    <div className={styles.panel}>
      {randomStatus === "idle" && (
        <div className={styles.idle}>
          <div className={styles.diceScene}>
            <div className={styles.dice}>
              <div className={`${styles.diceFace} ${styles.diceFront}`}>
                <span className={styles.dot}></span>
              </div>
              <div className={`${styles.diceFace} ${styles.diceBack}`}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
              <div className={`${styles.diceFace} ${styles.diceRight}`}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
              <div className={`${styles.diceFace} ${styles.diceLeft}`}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
              <div className={`${styles.diceFace} ${styles.diceTop}`}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
              <div className={`${styles.diceFace} ${styles.diceBottom}`}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
            </div>
          </div>
          <p className={styles.idleText}>
            Connect with a random stranger and start chatting!
          </p>
          <button
            className={styles.findBtn}
            onClick={() => socket && socket.emit("joinRandomPool")}
          >
            Find a Stranger
          </button>
          <img
            src="/images/random-chat.svg"
            alt="Random Chat"
            className={styles.idleImage}
          />
        </div>
      )}

      {randomStatus === "waiting" && (
        <div className={styles.waiting}>
          <div className={styles.loader}></div>
          <p className={styles.waitingText}>Looking for a stranger…</p>
          <div className={styles.countdown}>
            0:{waitingCountdown.toString().padStart(2, "0")}
          </div>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              socket && socket.emit("leaveRandomPool");
              setRandomStatus("idle");
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {randomStatus === "matched" &&
        randomPartner &&
        (() => {
          const u = randomPartner;
          const bgClass =
            u.gender === "female"
              ? sidebarStyles.femaleBg
              : u.gender === "other"
                ? sidebarStyles.otherBg
                : sidebarStyles.maleBg;
          const AvatarIcon =
            u.gender === "female"
              ? UserRound
              : u.gender === "other"
                ? UserCircle
                : UserIcon;
          const isBlocked = user?.blockedUsers?.includes(u._id);
          return (
            <div className={styles.matchedWrapper}>
              <div
                className={`${sidebarStyles.onlineUserRow} ${bgClass}`}
                onClick={() => {
                  setSelectedUser(u);
                  if (window.innerWidth <= 500) toggleSidebar();
                }}
              >
                {isBlocked && (
                  <div
                    className={sidebarStyles.blockedIndicator}
                    title="Blocked User"
                  >
                    <Ban
                      className={sidebarStyles.blockIcon}
                      size={16}
                      color="#ef4444"
                    />
                  </div>
                )}
                <div className={sidebarStyles.userIconWrapper}>
                  <AvatarIcon
                    className={sidebarStyles.userIconSolid}
                    fill="currentColor"
                  />
                </div>
                <div className={sidebarStyles.userInfo}>
                  <div className={sidebarStyles.userNameText}>{u.username}</div>
                  <div className={sidebarStyles.userDetails}>
                    {u.age} Yrs, {u.district}, Kerala
                  </div>
                </div>
                <button
                  className={sidebarStyles.moreIconBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === u._id ? null : u._id);
                  }}
                >
                  <MoreHorizontal
                    className={sidebarStyles.moreIcon}
                    size={18}
                  />
                </button>
                {openDropdownId === u._id && (
                  <div className={sidebarStyles.contextMenu}>
                    <div
                      className={`${sidebarStyles.contextMenuItem} ${isBlocked ? sidebarStyles.textUnblock : sidebarStyles.textBlock}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isBlocked) {
                          unblockUser(u._id);
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
              <div className={styles.btnRow}>
                <button
                  className={styles.stopBtn}
                  onClick={() => {
                    socket && socket.emit("leaveRandomPool");
                    setRandomStatus("idle");
                    setRandomPartner(null);
                    if (selectedUser?._id === u._id) setSelectedUser(null);
                  }}
                >
                  Stop
                </button>
                <button
                  className={styles.nextBtn}
                  onClick={() => {
                    socket && socket.emit("leaveRandomPool");
                    setRandomPartner(null);
                    if (selectedUser?._id === u._id) setSelectedUser(null);
                    setRandomStatus("waiting");
                    socket && socket.emit("joinRandomPool");
                  }}
                >
                  Next
                </button>
              </div>
              <img
                src="/images/two-hands-holding-phones-with-messages-in-speech-bubbles.svg"
                alt="Chatting Hands"
              />
            </div>
          );
        })()}
    </div>
  );
};

export default RandomChat;
