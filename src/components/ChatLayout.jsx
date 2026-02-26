import Sidebar from "./Sidebar";
import MainChat from "./MainChat";
import styles from "../styles/ChatLayout.module.css";

const ChatLayout = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <MainChat />
    </div>
  );
};

export default ChatLayout;
