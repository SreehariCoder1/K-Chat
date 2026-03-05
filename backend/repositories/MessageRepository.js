import Message from "../models/Message.js";

class MessageRepository {
  async saveMessage(messageData) {
    const message = new Message(messageData);
    return await message.save();
  }

  async getMessagesBetweenUsers(userId1, userId2) {
    return await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    }).sort({ createdAt: 1 }); // Chronological order
  }
}

export default new MessageRepository();
