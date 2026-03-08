import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import styles from "../styles/MainChat.module.css";
import { Send, PanelLeftOpen, Reply, X, Trash } from "lucide-react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

import { formatDateLabel, formatTime } from "../utils/dateUtils";

const MainChat = ({ isOpen, toggleSidebar, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [floatingDate, setFloatingDate] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
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
      const fetchMessages = async () => {
        try {
          const res = await axios.get(`/messages/${selectedUser._id}`);
          setMessages(res.data);
        } catch (error) {
          console.error("Failed to fetch messages", error);
        }
      };
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (
        selectedUser &&
        (message.senderId === selectedUser._id ||
          message.receiverId === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, message]);
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

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, selectedUser, replyingTo]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

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

    socket.emit("sendMessage", messageData, (savedMessage) => {
      if (savedMessage && !savedMessage.error) {
        setMessages((prev) =>
          prev.map((m) => (m._id === fakeId ? savedMessage : m)),
        );
      }
    });
    setNewMessage("");
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
        <h3 className={styles.chatHeaderTitle}>{selectedUser.username}</h3>
      </div>

      {floatingDate && (
        <div
          className={`${styles.floatingDateContainer} ${isScrolling ? styles.visible : ""}`}
        >
          <span className={styles.floatingDate}>{floatingDate}</span>
        </div>
      )}

      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {messages.map((m, index) => {
          const userId = user.id || user._id;
          const isSender = m.senderId === userId;

          const messageDateLabel = formatDateLabel(m.createdAt);
          const prevMessageDateLabel =
            index > 0 ? formatDateLabel(messages[index - 1].createdAt) : null;
          const showDateSeparator = messageDateLabel !== prevMessageDateLabel;

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
              <div id={`msg-${m._id}`} className={styles.messageWrapper}>
                <div
                  className={`${styles.messageRow} ${isSender ? styles.messageRowSender : styles.messageRowReceiver}`}
                >
                  <div
                    className={`${styles.messageBubble} ${isSender ? styles.bubbleSender : styles.bubbleReceiver}`}
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
                            {m.replyTo.message}
                          </div>
                        )}

                        <span className={styles.messageText}>{m.message}</span>
                      </>
                    )}

                    {/* Tail for receiver (left side) */}
                    {!isSender && <div className={styles.tailReceiver} />}

                    {/* Tail for sender (right side) */}
                    {isSender && <div className={styles.tailSender} />}

                    <span className={styles.messageTime}>{messageTime}</span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Banner */}
      {replyingTo && (
        <div className={styles.replyPreviewContainer}>
          <div className={styles.replyPreviewText}>
            <strong>
              {replyingTo.senderId === (user.id || user._id)
                ? "Replying to yourself"
                : `Replying to ${selectedUser.username}`}
              :
            </strong>{" "}
            {replyingTo.message}
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
          <textarea
            ref={textareaRef}
            className={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
    </div>
  );
};

export default MainChat;
