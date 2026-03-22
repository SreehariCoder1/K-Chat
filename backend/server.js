import "dotenv/config.js"; // Populates process.env before other imports
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import stickerRoutes from "./routes/stickerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
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
app.use("/api/users", userRoutes);

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
const userSocketMap = new Map(); // Map<UserId, Set<SocketId>>

// ── Random Chat Data Structures ──────────────────────────
const waitingPool = new Map();
const randomPairs = new Map();
const recentMatches = new Map();
const disconnectTimers = new Map();

// Prune expired entries from recentMatches for a given userId
function pruneRecentMatches(userId) {
  const list = recentMatches.get(userId);
  if (!list) return [];
  const now = Date.now();
  const valid = list.filter((e) => now - e.timestamp < 10 * 60 * 1000);
  if (valid.length === 0) {
    recentMatches.delete(userId);
  } else {
    recentMatches.set(userId, valid);
  }
  return valid;
}

// Add a recent match entry (keep only last 2)
function addRecentMatch(userId, partnerId) {
  pruneRecentMatches(userId);
  const list = recentMatches.get(userId) || [];
  list.push({ partnerId, timestamp: Date.now() });
  if (list.length > 2) list.shift();
  recentMatches.set(userId, list);
}

// Check if partnerId is in userId's recent match list
function isRecentMatch(userId, partnerId) {
  const list = pruneRecentMatches(userId);
  return list.some((e) => e.partnerId === partnerId);
}

function buildUserInfo(userDoc) {
  return {
    _id: userDoc._id.toString(),
    username: userDoc.username,
    gender: userDoc.gender,
    age: userDoc.age,
    district: userDoc.district,
  };
}

setInterval(
  () => {
    const now = Date.now();
    // Clean recentMatches
    for (const [userId, list] of recentMatches) {
      const valid = list.filter((e) => now - e.timestamp < 10 * 60 * 1000);
      if (valid.length === 0) recentMatches.delete(userId);
      else recentMatches.set(userId, valid);
    }
    // Clean waitingPool entries whose user is no longer online
    for (const [userId] of waitingPool) {
      if (!userSocketMap.has(userId)) {
        waitingPool.delete(userId);
      }
    }
    // Clean randomPairs entries whose user is no longer online (and grace period expired)
    for (const [userId] of randomPairs) {
      if (!userSocketMap.has(userId) && !disconnectTimers.has(userId)) {
        const partnerId = randomPairs.get(userId);
        randomPairs.delete(userId);
        if (partnerId && randomPairs.has(partnerId)) {
          randomPairs.delete(partnerId);
          const partnerSockets = userSocketMap.get(partnerId);
          if (partnerSockets) {
            for (const sid of partnerSockets) {
              io.to(sid).emit("randomPartnerLeft");
            }
          }
        }
      }
    }
  },
  5 * 60 * 1000,
);

io.on("connection", (socket) => {
  socket.on("addNewUser", async (userId) => {
    try {
      if (userId) {
        const user = await User.findById(userId).select(
          "username age gender district blockedUsers",
        );
        if (user) {
          // Cancel any pending disconnect timer for this user
          if (disconnectTimers.has(userId)) {
            clearTimeout(disconnectTimers.get(userId));
            disconnectTimers.delete(userId);
          }

          onlineUsers.set(socket.id, user);

          if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
          }
          userSocketMap.get(userId).add(socket.id);

          const allUsers = Array.from(onlineUsers.values());
          const uniqueUsers = Array.from(
            new Map(allUsers.map((u) => [u._id.toString(), u])).values(),
          );
          io.emit("getOnlineUsers", uniqueUsers);

          // ── Resume random session if one exists ───────────────────────
          // If user was in waitingPool, update their socketId
          if (waitingPool.has(userId)) {
            const entry = waitingPool.get(userId);
            entry.socketId = socket.id;
            socket.emit("randomWaiting");
          }

          // If user was in an active random pair, resume the session
          if (randomPairs.has(userId)) {
            const partnerId = randomPairs.get(userId);
            const partnerUser = await User.findById(partnerId).select(
              "username age gender district",
            );
            if (partnerUser) {
              socket.emit("randomResumed", {
                partner: buildUserInfo(partnerUser),
              });
            }
          }
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(err);
      }
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

        // Check if receiver blocked sender
        const receiver = await User.findById(receiverId).select("blockedUsers");
        let isBlocked = false;
        if (
          receiver &&
          receiver.blockedUsers &&
          receiver.blockedUsers.includes(senderId)
        ) {
          isBlocked = true;
        }

        // Save to DB
        let savedMessage = await MessageRepository.saveMessage({
          senderId,
          receiverId,
          message: type === "sticker" ? "" : message,
          type: type || "text",
          stickerUrl,
          replyTo,
          isBlocked,
        });

        // Populate replyTo for realtime receiver update
        savedMessage = await savedMessage.populate(
          "replyTo",
          "message senderId type stickerUrl",
        );

        // Real-time emit to receiver if online and not blocked
        const receiverSockets = userSocketMap.get(receiverId);
        if (receiverSockets && !isBlocked) {
          for (const sid of receiverSockets) {
            io.to(sid).emit("receiveMessage", savedMessage);
          }
        }

        // Return the saved message to the sender so they get the real DB _id
        if (typeof callback === "function") {
          callback(savedMessage);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Socket error on sendMessage:", error);
        }
        if (typeof callback === "function") {
          callback({ error: "Failed to send message" });
        }
      }
    },
  );

  socket.on("typing", async ({ senderId, receiverId }) => {
    const receiverSockets = userSocketMap.get(receiverId);
    if (receiverSockets) {
      const receiver = await User.findById(receiverId).select("blockedUsers");
      if (
        receiver &&
        receiver.blockedUsers &&
        receiver.blockedUsers.includes(senderId)
      ) {
        return;
      }
      for (const sid of receiverSockets) {
        io.to(sid).emit("typing", { senderId });
      }
    }
  });

  socket.on("stopTyping", async ({ senderId, receiverId }) => {
    const receiverSockets = userSocketMap.get(receiverId);
    if (receiverSockets) {
      const receiver = await User.findById(receiverId).select("blockedUsers");
      if (
        receiver &&
        receiver.blockedUsers &&
        receiver.blockedUsers.includes(senderId)
      ) {
        return;
      }
      for (const sid of receiverSockets) {
        io.to(sid).emit("stopTyping", { senderId });
      }
    }
  });

  socket.on("markMessagesRead", async ({ senderId, receiverId }) => {
    try {
      await MessageRepository.markMessagesAsRead(senderId, receiverId);
      const currentUserSockets = userSocketMap.get(receiverId);
      if (currentUserSockets) {
        for (const sid of currentUserSockets) {
          io.to(sid).emit("messagesRead", { senderId });
        }
      }
    } catch (err) {
      console.error("Socket error on markMessagesRead:", err);
    }
  });

  // ── Effects Feature ────────────────────────────────────────────────────
  // Emits to both the receiver AND echoes back to the sender so both
  // chatting users see the animation at the same time.
  socket.on("playEffect", async ({ senderId, receiverId, effectType }) => {
    const receiverSockets = userSocketMap.get(receiverId);
    let isBlocked = false;
    if (receiverSockets) {
      const receiver = await User.findById(receiverId).select("blockedUsers");
      if (
        receiver &&
        receiver.blockedUsers &&
        receiver.blockedUsers.includes(senderId)
      ) {
        isBlocked = true;
      }
    }
    if (receiverSockets && !isBlocked) {
      for (const sid of receiverSockets) {
        io.to(sid).emit("playEffect", { senderId, effectType });
      }
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
        const receiverSockets = userSocketMap.get(
          message.receiverId.toString(),
        );
        if (receiverSockets) {
          for (const sid of receiverSockets) {
            io.to(sid).emit("messageDeleted", updatedMessage);
          }
        }

        // emit back to sender to update their UI definitively
        socket.emit("messageDeleted", updatedMessage);
      }
    } catch (error) {
      console.error("Socket error on deleteMessage:", error);
    }
  });

  // ── Random Chat ────────────────────────────────────────────────────────────

  socket.on("joinRandomPool", async () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    const userId = user._id.toString();

    // Already paired? Ignore.
    if (randomPairs.has(userId)) return;

    // Already waiting? Ignore duplicate joins.
    if (waitingPool.has(userId)) return;

    // Fetch fresh blocked list
    const freshUser = await User.findById(userId).select("blockedUsers");
    const myBlockedList =
      freshUser?.blockedUsers?.map((id) => id.toString()) || [];

    // Build candidates list (all current pool members)
    const candidates = [];
    const recentOnlyCandidates = []; // fallback if only recent matches available

    for (const [candidateId, candidateEntry] of waitingPool) {
      // Prevent self-matching
      if (candidateId === userId) continue;

      // Check if I blocked them
      if (myBlockedList.includes(candidateId)) continue;

      // Check if they blocked me
      const candidateUser =
        await User.findById(candidateId).select("blockedUsers");
      if (
        candidateUser?.blockedUsers?.some(
          (blockedId) => blockedId.toString() === userId,
        )
      ) {
        continue;
      }

      // Check for chat history
      const hasHistory = await MessageRepository.haveChatHistory(
        userId,
        candidateId,
      );
      if (hasHistory) continue;

      // Check recent matches
      if (
        isRecentMatch(userId, candidateId) ||
        isRecentMatch(candidateId, userId)
      ) {
        recentOnlyCandidates.push({ candidateId, candidateEntry });
        continue;
      }

      candidates.push({ candidateId, candidateEntry });
    }

    // Pick a match: prefer non-recent candidates, fallback to recent if nothing else
    const matchPool = candidates.length > 0 ? candidates : recentOnlyCandidates;

    if (matchPool.length > 0) {
      const match = matchPool[0];
      const partnerId = match.candidateId;
      const partnerEntry = match.candidateEntry;

      // Remove partner from waiting pool
      waitingPool.delete(partnerId);

      // Record pair
      randomPairs.set(userId, partnerId);
      randomPairs.set(partnerId, userId);

      // Record recent matches for both
      addRecentMatch(userId, partnerId);
      addRecentMatch(partnerId, userId);

      const myInfo = buildUserInfo(user);

      socket.emit("randomMatched", { partner: partnerEntry.userInfo });
      const partnerSockets = userSocketMap.get(partnerId);
      if (partnerSockets) {
        for (const sid of partnerSockets) {
          io.to(sid).emit("randomMatched", { partner: myInfo });
        }
      }
    } else {
      // No valid match — add to waiting pool
      waitingPool.set(userId, {
        socketId: socket.id,
        userInfo: buildUserInfo(user),
      });
      socket.emit("randomWaiting");
    }
  });

  socket.on("leaveRandomPool", () => {
    const user = onlineUsers.get(socket.id);
    if (!user) return;
    const userId = user._id.toString();

    waitingPool.delete(userId);

    // If in a pair, notify partner and clean up
    if (randomPairs.has(userId)) {
      const partnerId = randomPairs.get(userId);
      randomPairs.delete(userId);
      randomPairs.delete(partnerId);
      const partnerSockets = userSocketMap.get(partnerId);
      if (partnerSockets) {
        for (const sid of partnerSockets) {
          io.to(sid).emit("randomPartnerLeft");
        }
      }
    }
  });

  // ── Disconnect with grace period ──────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const user = onlineUsers.get(socket.id);
    if (!user) {
      onlineUsers.delete(socket.id);
      return;
    }
    const userId = user._id.toString();

    onlineUsers.delete(socket.id);

    if (userSocketMap.has(userId)) {
      userSocketMap.get(userId).delete(socket.id);
      if (userSocketMap.get(userId).size === 0) {
        userSocketMap.delete(userId);
      }
    }

    const allUsers = Array.from(onlineUsers.values());
    const uniqueUsers = Array.from(
      new Map(allUsers.map((u) => [u._id.toString(), u])).values(),
    );
    io.emit("getOnlineUsers", uniqueUsers);

    // Start a grace period for random session survival
    const isInRandomSession =
      randomPairs.has(userId) || waitingPool.has(userId);

    if (isInRandomSession) {
      const timer = setTimeout(() => {
        disconnectTimers.delete(userId);

        waitingPool.delete(userId);

        if (randomPairs.has(userId)) {
          const partnerId = randomPairs.get(userId);
          randomPairs.delete(userId);
          randomPairs.delete(partnerId);
          const partnerSockets = userSocketMap.get(partnerId);
          if (partnerSockets) {
            for (const sid of partnerSockets) {
              io.to(sid).emit("randomPartnerLeft");
            }
          }
        }
      }, 5000);

      disconnectTimers.set(userId, timer);
    }
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
