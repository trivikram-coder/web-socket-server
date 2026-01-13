const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory storage
const roomChats = {}; // { roomId: [ { userName, message } ] }
const users = {};     // { roomId: [ { userName, socketId } ] }

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // -------------------------
  // JOIN ROOM
  // -------------------------
  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);

    if (!users[roomId]) users[roomId] = [];
    if (!roomChats[roomId]) roomChats[roomId] = [];

    // Add user by socketId (NOT username)
    if (!users[roomId].some(u => u.socketId === socket.id)) {
      users[roomId].push({
        userName,
        socketId: socket.id,
      });
    }

    console.log("👥 Users:", users);

    // 🔥 Send updated users list to EVERYONE in room
    io.to(roomId).emit("room-users", users[roomId]);

    // 🔥 Send chat history ONLY to joining user
    socket.emit("receive-message", {
      chats: roomChats[roomId],
    });
  });

  // -------------------------
  // SEND MESSAGE (REALTIME)
  // -------------------------
  socket.on("send-message", ({ roomId, userName, message }) => {
    if (!roomChats[roomId]) roomChats[roomId] = [];

    roomChats[roomId].push({
      userName,
      message,
    });

    // 🔥 Broadcast to everyone in room
    io.to(roomId).emit("receive-message", {
      chats: roomChats[roomId],
      time: new Date().toLocaleString(),
    });
  });

  // -------------------------
  // OPTIONAL: GET USERS
  // -------------------------
  socket.on("get-users", (roomId) => {
    socket.emit("room-users", users[roomId] || []);
  });

  // -------------------------
  // OPTIONAL: GET CHATS
  // -------------------------
  socket.on("get-chats", (roomId) => {
    socket.emit("receive-message", {
      chats: roomChats[roomId] || [],
    });
  });

  // -------------------------
  // LEAVE ROOM (MANUAL)
  // -------------------------
  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);

    if (!users[roomId]) return;

    users[roomId] = users[roomId].filter(
      u => u.socketId !== socket.id
    );

    io.to(roomId).emit("room-users", users[roomId]);
  });

  // -------------------------
  // DISCONNECT (TAB CLOSE / MOBILE)
  // -------------------------
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    for (const roomId in users) {
      users[roomId] = users[roomId].filter(
        u => u.socketId !== socket.id
      );

      io.to(roomId).emit("room-users", users[roomId]);
    }
  });
});

// Start server
server.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
