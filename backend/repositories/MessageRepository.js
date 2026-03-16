import mongoose from "mongoose";
import Message from "../models/Message.js";

class MessageRepository {
  async saveMessage(messageData) {
    const message = new Message(messageData);
    return await message.save();
  }

  async getMessagesBetweenUsers(requestingUserId, targetUserId) {
    return await Message.find({
      $and: [
        {
          $or: [
            { senderId: requestingUserId, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: requestingUserId },
          ],
        },
        {
          $or: [
            { senderId: requestingUserId }, // Messages I sent
            { receiverId: requestingUserId, isBlocked: false }, // Messages received but not blocked
          ],
        },
      ],
    })
      .populate("replyTo", "message senderId type stickerUrl")
      .sort({ createdAt: 1 }); // Chronological order
  }

  async getChattedUsers(userId) {
    const objectId = new mongoose.Types.ObjectId(userId);

    const history = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: objectId }, { receiverId: objectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", objectId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessageTime: { $first: "$createdAt" },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: "$userDetails._id",
          username: "$userDetails.username",
          gender: "$userDetails.gender",
          age: "$userDetails.age",
          district: "$userDetails.district",
          lastMessageTime: 1,
        },
      },
    ]);

    return history;
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
