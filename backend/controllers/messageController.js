import MessageRepository from "../repositories/MessageRepository.js";

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id; // From auth middleware

    const messages = await MessageRepository.getMessagesBetweenUsers(
      senderId, // This is the requesting user
      userToChatId, // This is the target user
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await MessageRepository.getChattedUsers(userId);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
