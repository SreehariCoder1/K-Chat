import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import http from "http";
import { Server } from "socket.io";
import User from "./models/User.js";
import MessageRepository from "./repositories/MessageRepository.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
    credentials: true, // Allow cookies to be sent along with the request
  }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
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
          io.emit("getOnlineUsers", Array.from(onlineUsers.values()));
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on(
    "sendMessage",
    async ({ senderId, receiverId, message, replyTo }) => {
      try {
        // Save to DB
        let savedMessage = await MessageRepository.saveMessage({
          senderId,
          receiverId,
          message,
          replyTo,
        });

        // Populate replyTo for realtime receiver update
        savedMessage = await savedMessage.populate(
          "replyTo",
          "message senderId",
        );

        // Real-time emit to receiver if online
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", savedMessage);
        }
      } catch (error) {
        console.error("Socket error on sendMessage:", error);
      }
    },
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const user = onlineUsers.get(socket.id);
    if (user) {
      userSocketMap.delete(user._id.toString());
    }
    onlineUsers.delete(socket.id);
    io.emit("getOnlineUsers", Array.from(onlineUsers.values()));
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
