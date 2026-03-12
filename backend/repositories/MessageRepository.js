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
    })
      .populate("replyTo", "message senderId type stickerUrl")
      .sort({ createdAt: 1 }); // Chronological order
  }

  async getMessageById(messageId) {
    return await Message.findById(messageId);
  }

  async updateMessage(messageId, updateData) {
    return await Message.findByIdAndUpdate(messageId, updateData, {
      new: true,
    });
  }
}

export default new MessageRepository();
