import { useState } from "react";
import Sidebar from "./Sidebar";
import MainChat from "./MainChat";
import styles from "../styles/ChatLayout.module.css";

const ChatLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className={styles.layout}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <MainChat isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
    </div>
  );
};

export default ChatLayout;
