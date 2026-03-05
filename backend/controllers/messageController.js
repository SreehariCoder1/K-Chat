import MessageRepository from "../repositories/MessageRepository.js";

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id; // From auth middleware

    const messages = await MessageRepository.getMessagesBetweenUsers(
      senderId,
      userToChatId,
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
