import { useState } from "react";
import Sidebar from "./Sidebar";
import MainChat from "./MainChat";
import styles from "../styles/ChatLayout.module.css";

const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
      />
      <MainChat
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        selectedUser={selectedUser}
      />
    </div>
  );
};

export default ChatLayout;
