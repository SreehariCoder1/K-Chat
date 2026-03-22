import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import styles from "../styles/MainChat.module.css";
import typingStyles from "../styles/typingIndicator.module.css";
import {
  Send,
  PanelLeftOpen,
  Reply,
  X,
  Trash,
  ChevronDown,
  Sticker,
  Sparkles,
  Heart,
} from "lucide-react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";
import MessageSearch from "./MessageSearch";
import { formatDateLabel, formatTime } from "../utils/dateUtils";
import ParticleBackground from "./ParticleBackground";
import StickerPicker from "./StickerPicker";
import EffectAnimation from "./EffectAnimation";

const renderMessageWithLinks = (text, searchQuery = "") => {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  const renderHighlightedPart = (pt, idx) => {
    if (!searchQuery.trim()) return pt;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    const subParts = pt.split(regex);
    return subParts.map((sp, i) =>
      sp.toLowerCase() === searchQuery.toLowerCase() ? (
        <span key={`${idx}-${i}`} className={styles.highlightedText}>
          {sp}
        </span>
      ) : (
        sp
      ),
    );
  };

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith("www.") ? `http://${part}` : part;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.messageLink}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return renderHighlightedPart(part, index);
  });
};

const EFFECTS_CONFIG = [
  { id: "EFFECT1", icon: "🔫", label: "Money Gun" },
  { id: "EFFECT2", icon: "🛸", label: "UFO Abduction" },
  { id: "EFFECT3", icon: "🤯", label: "Mind Blown" },
  { id: "EFFECT4", icon: "🚀", label: "Rocket" },
  { id: "EFFECT5", icon: "⚔️", label: "Fight" },
  { id: "EFFECT6", icon: "🐊", label: "Crocodile" },
  { id: "EFFECT7", icon: "😮", label: "Wow" },
  { id: "EFFECT8", icon: "⚡", label: "Lightning" },
  { id: "EFFECT9", icon: "🚗", label: "Car" },
  { id: "EFFECT10", icon: "💣", label: "Bomb" },
];

const MainChat = ({ isOpen, toggleSidebar, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { user, unblockUser, addFavorite, removeFavorite } =
    useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [floatingDate, setFloatingDate] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showEffectsPicker, setShowEffectsPicker] = useState(false);
  const [senderEffectType, setSenderEffectType] = useState(null);
  const [receiverEffectType, setReceiverEffectType] = useState(null);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 501px)").matches,
  );
  const [prevUserId, setPrevUserId] = useState(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const newUserLoadRef = useRef(false);

  // Adjust state during render
  if (selectedUser?._id !== prevUserId) {
    setPrevUserId(selectedUser?._id);
    setIsTyping(false);
  }

  // Track mobile breakpoint so effects don't play when main chat is hidden
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 501px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isBlocked = user?.blockedUsers?.includes(selectedUser?._id);

  const isChatVisible = !isMobile || !isOpen;

  const isChatVisibleRef = useRef(isChatVisible);
  useEffect(() => {
    isChatVisibleRef.current = isChatVisible;
  }, [isChatVisible]);

  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      150;

    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;

    // Check if scrolled up more than 150px
    const isScrolledUp =
      container.scrollHeight - container.scrollTop - container.clientHeight >
      150;
    setShowScrollBtn(isScrolledUp);

    const dateElements = container.querySelectorAll("[data-date]");

    let visibleDate = "";

    for (let i = 0; i < dateElements.length; i++) {
      const el = dateElements[i];
      const rect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (rect.top <= containerRect.top + 50) {
        visibleDate = el.getAttribute("data-date");
      } else if (visibleDate === "" && rect.top > containerRect.top) {
        // Fallback if we scroll fast: pick the first one in view
        visibleDate = el.getAttribute("data-date");
        break;
      } else {
        break; // Stop looking since elements are ordered
      }
    }

    setFloatingDate(visibleDate);

    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1500); // Hide after 1.5s of no scroll activity
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, messages]);

  // Initial calculation
  useEffect(() => {
    handleScroll();
  }, [messages, handleScroll]);

  useEffect(() => {
    if (selectedUser) {
      newUserLoadRef.current = true;
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`/messages/${selectedUser._id}`);
          setMessages(res.data);

          if (isChatVisibleRef.current && socket) {
            const userId = user.id || user._id;
            socket.emit("markMessagesRead", {
              senderId: selectedUser._id,
              receiverId: userId,
            });
          }
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      };
      fetchMessages();
    }
  }, [selectedUser, socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (
        selectedUser &&
        (message.senderId === selectedUser._id ||
          message.receiverId === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
        if (message.senderId === selectedUser._id) {
          setIsTyping(false);

          if (isChatVisibleRef.current && socket) {
            const userId = user.id || user._id;
            socket.emit("markMessagesRead", {
              senderId: selectedUser._id,
              receiverId: userId,
            });
          }
        }
      }
    };

    const handleMessageDeleted = (deletedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === deletedMessage._id ? deletedMessage : msg,
        ),
      );
      if (replyingTo && replyingTo._id === deletedMessage._id) {
        setReplyingTo(null);
      }
    };

    const handleTypingEvent = ({ senderId }) => {
      if (selectedUser && senderId === selectedUser._id) {
        setIsTyping(true);
      }
    };

    const handleStopTypingEvent = ({ senderId }) => {
      if (selectedUser && senderId === selectedUser._id) {
        setIsTyping(false);
      }
    };

    const handlePlayEffectEvent = ({ senderId, effectType }) => {
      // Only process the effect if the chat is currently visible to the user
      if (!isChatVisibleRef.current) return;

      const userId = user.id || user._id;
      if (senderId === userId) {
        setSenderEffectType(effectType);
      } else if (selectedUser && senderId === selectedUser._id) {
        // Only play received effects if the sender is the currently selected user
        setReceiverEffectType(effectType);
      }
    };

    const handleReconnect = async () => {
      if (selectedUser) {
        try {
          const res = await axios.get(`/messages/${selectedUser._id}`);
          setMessages(res.data);

          if (isChatVisibleRef.current) {
            const userId = user.id || user._id;
            socket.emit("markMessagesRead", {
              senderId: selectedUser._id,
              receiverId: userId,
            });
          }
        } catch (error) {
          console.error("Failed to fetch messages on reconnect", error);
        }
      }
    };

    socket.on("connect", handleReconnect);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("typing", handleTypingEvent);
    socket.on("stopTyping", handleStopTypingEvent);
    socket.on("playEffect", handlePlayEffectEvent);

    return () => {
      socket.off("connect", handleReconnect);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("typing", handleTypingEvent);
      socket.off("stopTyping", handleStopTypingEvent);
      socket.off("playEffect", handlePlayEffectEvent);
    };
  }, [socket, selectedUser, replyingTo, user]);

  useEffect(() => {
    if (newUserLoadRef.current) {
      newUserLoadRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    } else {
      scrollToBottom();
    }
  }, [messages]);

  const processedMessages = useMemo(() => {
    const results = [];
    let currentGroupStartTime = null;
    let currentGroupSenderId = null;

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const messageDateLabel = formatDateLabel(m.createdAt);
      const prevMessageDateLabel =
        i > 0 ? formatDateLabel(messages[i - 1].createdAt) : null;
      const showDateSeparator = messageDateLabel !== prevMessageDateLabel;

      const msgTime = new Date(m.createdAt).getTime();

      // Sender Grouping Logic (Consecutive Messages within 5 minutes of the FIRST message in the group)
      let isGrouped = false;

      if (
        !showDateSeparator &&
        currentGroupSenderId === m.senderId &&
        currentGroupStartTime &&
        msgTime - currentGroupStartTime < 5 * 60 * 1000
      ) {
        isGrouped = true;
      } else {
        // Start a new group
        isGrouped = false;
        currentGroupSenderId = m.senderId;
        currentGroupStartTime = msgTime;
      }

      results.push({
        ...m,
        isGrouped,
        showDateSeparator,
        messageDateLabel,
      });
    }
    return results;
  }, [messages]);

  const scrollToSearchResult = useCallback((targetId) => {
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove(styles.searchTargetFlash);
      // Wait a tiny bit and apply the flash
      setTimeout(() => {
        el.classList.add(styles.searchTargetFlash);
        setTimeout(() => {
          el.classList.remove(styles.searchTargetFlash);
        }, 2000);
      }, 10);
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  useEffect(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [selectedUser]);

  const handleTypingChange = (e) => {
    setNewMessage(e.target.value);

    if (socket && selectedUser) {
      const userId = user.id || user._id;
      socket.emit("typing", { senderId: userId, receiverId: selectedUser._id });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          senderId: userId,
          receiverId: selectedUser._id,
        });
      }, 2000);
    }
  };

  const handleSenderEffectDone = useCallback(
    () => setSenderEffectType(null),
    [],
  );
  const handleReceiverEffectDone = useCallback(
    () => setReceiverEffectType(null),
    [],
  );

  const handleTriggerEffect = (effectType) => {
    if (!selectedUser) return;
    const userId = user.id || user._id;

    const payload = {
      senderId: userId,
      receiverId: selectedUser._id,
      effectType,
    };
    socket.emit("playEffect", payload);
    setShowEffectsPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const userId = user.id || user._id;

    const messageData = {
      senderId: userId,
      receiverId: selectedUser._id,
      message: newMessage,
      replyTo: replyingTo ? replyingTo._id : null,
      createdAt: new Date().toISOString(),
    };

    const fakeId = Date.now().toString();

    // Clear typing timeout and emit stopTyping manually
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stopTyping", {
      senderId: userId,
      receiverId: selectedUser._id,
    });

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        _id: fakeId,
        replyTo: replyingTo
          ? {
              _id: replyingTo._id,
              message: replyingTo.message,
              senderId: replyingTo.senderId,
              type: replyingTo.type,
              stickerUrl: replyingTo.stickerUrl,
            }
          : null,
      },
    ]);

    // Force scroll to bottom when the current user explicitly sends a message
    setTimeout(() => scrollToBottom(true), 50);

    socket.emit("sendMessage", messageData, (savedMessage) => {
      if (savedMessage && !savedMessage.error) {
        setMessages((prev) =>
          prev.map((m) => (m._id === fakeId ? savedMessage : m)),
        );
        window.dispatchEvent(
          new CustomEvent("localMessageSent", { detail: savedMessage }),
        );
      }
    });
    setNewMessage("");
    setReplyingTo(null);
  };

  const handleSendSticker = (sticker) => {
    if (!selectedUser) return;

    const userId = user.id || user._id;

    const messageData = {
      senderId: userId,
      receiverId: selectedUser._id,
      message: "", // empty for stickers
      type: "sticker",
      stickerUrl: sticker.url,
      replyTo: replyingTo ? replyingTo._id : null,
      createdAt: new Date().toISOString(),
    };

    const fakeId = Date.now().toString();

    // Clear typing timeout and emit stopTyping manually
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("stopTyping", {
      senderId: userId,
      receiverId: selectedUser._id,
    });

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        _id: fakeId,
        replyTo: replyingTo
          ? {
              _id: replyingTo._id,
              message: replyingTo.message,
              senderId: replyingTo.senderId,
            }
          : null,
      },
    ]);

    setTimeout(() => scrollToBottom(true), 50);

    socket.emit("sendMessage", messageData, (savedMessage) => {
      if (savedMessage && !savedMessage.error) {
        setMessages((prev) =>
          prev.map((m) => (m._id === fakeId ? savedMessage : m)),
        );
        window.dispatchEvent(
          new CustomEvent("localMessageSent", { detail: savedMessage }),
        );
      }
    });

    setShowStickerPicker(false);
    setReplyingTo(null);
  };

  const handleDeleteMessage = (messageId) => {
    if (socket) {
      socket.emit("deleteMessage", { messageId });
    }
  };

  if (!selectedUser) {
    return (
      <div className={styles.mainChat}>
        <ParticleBackground />
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
          <p className={styles.welcomeSubtitle}>
            Select a user from the sidebar to start chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mainChat}>
      <ParticleBackground />
      {isChatVisible && senderEffectType && (
        <EffectAnimation
          role="sender"
          effect={senderEffectType}
          onDone={handleSenderEffectDone}
        />
      )}
      {isChatVisible && receiverEffectType && (
        <EffectAnimation
          role="receiver"
          effect={receiverEffectType}
          onDone={handleReceiverEffectDone}
        />
      )}
      {!isOpen && (
        <button
          className={styles.openSidebarBtn}
          onClick={toggleSidebar}
          title="Open Sidebar"
        >
          <PanelLeftOpen className={styles.toggleBtn} size={24} />
        </button>
      )}

      <div className={styles.chatHeader}>
        <div className={styles.headerTitleContainer}>
          <h3 className={styles.chatHeaderTitle}>{selectedUser.username}</h3>
          {user?.favorites?.includes(selectedUser._id) ? (
            <Heart
              size={20}
              color="#ef4444"
              fill="#ef4444"
              style={{
                cursor: "pointer",
                marginTop: "0.1em",
                width: "1rem",
                height: "1rem",
              }}
              onClick={() => removeFavorite(selectedUser._id)}
              title="Remove from favorites"
            />
          ) : (
            <Heart
              size={20}
              color="#ef4444"
              style={{
                cursor: "pointer",
                marginTop: "0.1em",
                width: "1rem",
                height: "1rem",
              }}
              onClick={() => addFavorite(selectedUser._id)}
              title="Add to favorites"
            />
          )}
        </div>

        <div className={styles.headerRightControls}>
          <MessageSearch
            messages={messages}
            searchQuery={searchQuery}
            onQueryChange={setSearchQuery}
            onScrollTo={scrollToSearchResult}
          />

          {isTyping && (
            <div
              className={`${typingStyles.typingIndicator} ${typingStyles.headerPosition}`}
              title="Typing..."
            >
              <span className={typingStyles.dot}></span>
              <span className={typingStyles.dot}></span>
              <span className={typingStyles.dot}></span>
            </div>
          )}
        </div>
      </div>
      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        <div className={styles.safetyBanner}>
          🛡️ Stay safe. Avoid sharing sensitive personal information in chats.
          <a
            href="https://reachlink.com/advice/chat/stay-safe-while-chatting-with-online-strangers-essential-tips/"
            className={styles.adviceLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            ADVICE
          </a>
        </div>
        {floatingDate && (
          <div
            className={`${styles.floatingDateContainer} ${isScrolling ? styles.visible : ""}`}
          >
            <span className={styles.floatingDate}>{floatingDate}</span>
          </div>
        )}
        {processedMessages.map((m, index) => {
          const userId = user.id || user._id;
          const isSender = m.senderId === userId;
          const { isGrouped, showDateSeparator, messageDateLabel } = m;

          const messageTime = formatTime(m.createdAt);

          // Check if message is less than 15 mins old
          const isUnder15Mins =
            (new Date() - new Date(m.createdAt)) / 60000 <= 15;
          const canDelete = isSender && isUnder15Mins && !m.isDeleted;

          return (
            <React.Fragment key={m._id || index}>
              {showDateSeparator && (
                <div
                  className={styles.dateSeparatorWrapper}
                  data-date={messageDateLabel}
                >
                  <span className={styles.dateSeparator}>
                    {messageDateLabel}
                  </span>
                </div>
              )}
              <div
                id={`msg-${m._id}`}
                className={`${styles.messageWrapper} ${isGrouped ? styles.groupedMessageWrapper : ""}`}
              >
                <div
                  className={`${styles.messageRow} ${isSender ? styles.messageRowSender : styles.messageRowReceiver}`}
                >
                  <div
                    className={`${styles.messageBubble} ${isSender ? styles.bubbleSender : styles.bubbleReceiver} ${m.type === "sticker" ? styles.stickerBubble : ""}`}
                  >
                    {m.isDeleted ? (
                      <span className={styles.deletedText}>{m.message}</span>
                    ) : (
                      <>
                        {/* Reply Action Button - Top Right */}
                        <button
                          className={styles.replyBtn}
                          onClick={() => setReplyingTo(m)}
                          title="Reply"
                        >
                          <Reply className={styles.replyIcon} size={12} />
                        </button>

                        {/* Delete Action Button */}
                        {canDelete && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteMessage(m._id)}
                            title="Delete message"
                          >
                            <Trash className={styles.deleteIcon} size={12} />
                          </button>
                        )}

                        {/* Replied Snippet */}
                        {m.replyTo && typeof m.replyTo === "object" && (
                          <div
                            className={styles.repliedSnippet}
                            onClick={() => {
                              if (m.replyTo._id) {
                                const el = document.getElementById(
                                  `msg-${m.replyTo._id}`,
                                );
                                if (el) {
                                  el.scrollIntoView({
                                    behavior: "auto",
                                    block: "center",
                                  });
                                  // Remove class if it's already there to re-trigger animation
                                  el.classList.remove(
                                    styles.highlightedMessage,
                                  );
                                  // small delay to force reflow and restart animation
                                  setTimeout(() => {
                                    el.classList.add(styles.highlightedMessage);
                                    setTimeout(() => {
                                      el.classList.remove(
                                        styles.highlightedMessage,
                                      );
                                    }, 2000); // match css duration
                                  }, 10);
                                }
                              }
                            }}
                          >
                            <span className={styles.repliedSender}>
                              {m.replyTo.senderId === userId
                                ? "You"
                                : selectedUser.username}
                            </span>
                            {m.replyTo.type === "sticker" ? (
                              <div className={styles.repliedSticker}>
                                <span className={styles.repliedStickerText}>
                                  Sticker
                                </span>
                                <img
                                  src={m.replyTo.stickerUrl}
                                  alt="sticker"
                                  className={styles.repliedStickerImg}
                                />
                              </div>
                            ) : (
                              renderMessageWithLinks(
                                m.replyTo.message,
                                searchQuery,
                              )
                            )}
                          </div>
                        )}

                        {m.type === "sticker" ? (
                          <img
                            src={m.stickerUrl}
                            alt="sticker"
                            className={styles.renderedSticker}
                          />
                        ) : (
                          <span className={styles.messageText}>
                            {renderMessageWithLinks(m.message, searchQuery)}
                          </span>
                        )}
                      </>
                    )}

                    {/* Tail for receiver (left side) */}
                    {!isSender && !isGrouped && m.type !== "sticker" && (
                      <div className={styles.tailReceiver} />
                    )}

                    {/* Tail for sender (right side) */}
                    {isSender && !isGrouped && m.type !== "sticker" && (
                      <div className={styles.tailSender} />
                    )}

                    <span
                      className={
                        m.type === "sticker"
                          ? styles.messageTimeSticker
                          : styles.messageTime
                      }
                    >
                      {messageTime}
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && (
        <button
          className={styles.scrollDownBtn}
          onClick={() =>
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
          }
          title="Scroll to bottom"
        >
          <ChevronDown className={styles.scrollDownIcon} size={20} />
        </button>
      )}

      <div className={styles.inputSection}>
        {isBlocked ? (
          <div className={styles.blockedMessageContainer}>
            <span>You have blocked this user.</span>
            <button
              onClick={() => unblockUser(selectedUser._id)}
              className={styles.unblockActionBtn}
            >
              Unblock
            </button>
          </div>
        ) : (
          <>
            {showStickerPicker && (
              <StickerPicker
                onClose={() => setShowStickerPicker(false)}
                onSendSticker={handleSendSticker}
              />
            )}

            {/* Reply Preview Banner */}
            {replyingTo && (
              <div className={styles.replyPreviewContainer}>
                <div className={styles.replyPreviewText}>
                  {replyingTo.type === "sticker" ? (
                    <div className={styles.replyPreviewSticker}>
                      <span>Sticker</span>
                      <img
                        src={replyingTo.stickerUrl}
                        alt="sticker preview"
                        className={styles.replyPreviewStickerImg}
                      />
                    </div>
                  ) : (
                    replyingTo.message
                  )}
                </div>
                <button
                  type="button"
                  className={styles.cancelReplyBtn}
                  onClick={() => setReplyingTo(null)}
                >
                  <X className={styles.cancelIcon} size={16} />
                </button>
              </div>
            )}

            <form className={styles.inputArea} onSubmit={handleSendMessage}>
              <div className={styles.inputWrapper}>
                <button
                  type="button"
                  className={`${styles.stickerToggleBtn} ${showStickerPicker ? styles.stickerToggleBtnActive : ""}`}
                  onClick={() => setShowStickerPicker(!showStickerPicker)}
                  title="Sticker"
                >
                  <Sticker className={styles.stickerIcon} size={20} />
                </button>
                <button
                  type="button"
                  className={`${styles.effectsToggleBtn} ${showEffectsPicker ? styles.effectsToggleBtnActive : ""}`}
                  onClick={() => setShowEffectsPicker(!showEffectsPicker)}
                  title="Effects Menu"
                >
                  <Sparkles className={styles.effectsIcon} size={20} />
                </button>

                {showEffectsPicker && (
                  <div className={styles.effectsPickerContainer}>
                    <div className={styles.effectsPickerGrid}>
                      {EFFECTS_CONFIG.map((effect) => (
                        <button
                          key={effect.id}
                          className={styles.effectItemBtn}
                          onClick={() => handleTriggerEffect(effect.id)}
                          title={effect.label}
                        >
                          <span className={styles.effectItemIcon}>
                            {effect.icon}
                          </span>
                          <span className={styles.effectItemLabel}>
                            {effect.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  className={styles.input}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTypingChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  maxLength={2000}
                />
              </div>
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!newMessage.trim()}
              >
                <Send className={styles.sendIcon} size={20} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default MainChat;
