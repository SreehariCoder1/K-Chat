import "dotenv/config.js"; // Populates process.env before other imports
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import stickerRoutes from "./routes/stickerRoutes.js";
import http from "http";
import { Server } from "socket.io";
import User from "./models/User.js";
import MessageRepository from "./repositories/MessageRepository.js";

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true, // Allow cookies to be sent along with the request
  }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/stickers", stickerRoutes);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

const onlineUsers = new Map();
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("addNewUser", async (userId) => {
    try {
      if (userId) {
        const user = await User.findById(userId).select(
          "username age gender district",
        );
        if (user) {
          onlineUsers.set(socket.id, user);
          userSocketMap.set(userId, socket.id);
          const allUsers = Array.from(onlineUsers.values());
          const uniqueUsers = Array.from(
            new Map(allUsers.map((u) => [u._id.toString(), u])).values(),
          );
          io.emit("getOnlineUsers", uniqueUsers);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on(
    "sendMessage",
    async (
      { senderId, receiverId, message, type, stickerUrl, replyTo },
      callback,
    ) => {
      try {
        if (type !== "sticker" && (!message || message.trim().length === 0)) {
          if (typeof callback === "function")
            callback({ error: "Message cannot be empty." });
          return;
        }
        if (message && message.length > 2000) {
          if (typeof callback === "function")
            callback({ error: "Message exceeds 2000 characters limit." });
          return;
        }

        // Save to DB
        let savedMessage = await MessageRepository.saveMessage({
          senderId,
          receiverId,
          message: type === "sticker" ? "" : message,
          type: type || "text",
          stickerUrl,
          replyTo,
        });

        // Populate replyTo for realtime receiver update
        savedMessage = await savedMessage.populate(
          "replyTo",
          "message senderId type stickerUrl",
        );

        // Real-time emit to receiver if online
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", savedMessage);
        }

        // Return the saved message to the sender so they get the real DB _id
        if (typeof callback === "function") {
          callback(savedMessage);
        }
      } catch (error) {
        console.error("Socket error on sendMessage:", error);
        if (typeof callback === "function") {
          callback({ error: "Failed to send message" });
        }
      }
    },
  );

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });

  // ── Effects Feature ────────────────────────────────────────────────────
  // Emits to both the receiver AND echoes back to the sender so both
  // chatting users see the animation at the same time.
  socket.on("playEffect", ({ senderId, receiverId, effectType }) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("playEffect", { senderId, effectType });
    }
    // Echo back to sender so they also see the animation
    socket.emit("playEffect", { senderId, effectType });
  });

  socket.on("deleteMessage", async ({ messageId }) => {
    try {
      const message = await MessageRepository.getMessageById(messageId);
      if (!message) return;

      const user = onlineUsers.get(socket.id);
      if (!user) return; // User must be online and authenticated in our map

      // Verify sender
      if (message.senderId.toString() !== user._id.toString()) return;

      // Verify time difference (<= 15 minutes)
      const now = new Date();
      const messageTime = new Date(message.createdAt);
      const diffMs = now - messageTime;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins <= 15 && !message.isDeleted) {
        const updatedMessage = await MessageRepository.updateMessage(
          messageId,
          {
            isDeleted: true,
            message: "This message was deleted",
            replyTo: null,
          },
        );

        // Broadcast to receiver if online
        const receiverSocketId = userSocketMap.get(
          message.receiverId.toString(),
        );
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageDeleted", updatedMessage);
        }

        // emit back to sender to update their UI definitively
        socket.emit("messageDeleted", updatedMessage);
      }
    } catch (error) {
      console.error("Socket error on deleteMessage:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const user = onlineUsers.get(socket.id);
    if (user) {
      userSocketMap.delete(user._id.toString());
    }
    onlineUsers.delete(socket.id);
    const allUsers = Array.from(onlineUsers.values());
    const uniqueUsers = Array.from(
      new Map(allUsers.map((u) => [u._id.toString(), u])).values(),
    );
    io.emit("getOnlineUsers", uniqueUsers);
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
