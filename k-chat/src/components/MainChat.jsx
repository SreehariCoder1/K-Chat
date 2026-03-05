import { useState, useEffect, useContext, useRef } from "react";
import styles from "../styles/MainChat.module.css";
import { Send, PanelLeftOpen } from "lucide-react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { SocketContext } from "../context/SocketContext";

const MainChat = ({ isOpen, toggleSidebar, selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

    socket.on("receiveMessage", handleReceiveMessage);

    return () => socket.off("receiveMessage", handleReceiveMessage);
  }, [socket, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const userId = user.id || user._id;

    const messageData = {
      senderId: userId,
      receiverId: selectedUser._id,
      message: newMessage,
    };

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { ...messageData, _id: Date.now().toString() },
    ]);

    socket.emit("sendMessage", messageData);
    setNewMessage("");
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

      <div className={styles.messagesContainer}>
        {messages.map((m) => {
          const userId = user.id || user._id;
          const isSender = m.senderId === userId;
          return (
            <div
              key={m._id}
              className={`${styles.messageRow} ${isSender ? styles.messageRowSender : styles.messageRowReceiver}`}
            >
              <div
                className={`${styles.messageBubble} ${isSender ? styles.bubbleSender : styles.bubbleReceiver}`}
              >
                {/* Tail for receiver (left side) */}
                {!isSender && <div className={styles.tailReceiver} />}

                {/* Tail for sender (right side) */}
                {isSender && <div className={styles.tailSender} />}

                {m.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className={styles.inputArea} onSubmit={handleSendMessage}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
