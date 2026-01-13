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
const roomChats={}
const users={}
io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  socket.on("join-room", (data) => {
    socket.join(data.roomId);

    if (!users[data.roomId]) users[data.roomId] = [];

    if (!users[data.roomId].some(u => u.socketId === socket.id)) {
      users[data.roomId].push({ userName: data.userName,socketId:socket.id });
    }
    console.log(users)
    socket.emit("room-users", users[data.roomId]);
    socket.emit('receive-message',{
      chats:roomChats[data.roomId] || []
    })
  });

  socket.on("send-message", (data) => {
    if (!roomChats[data.roomId]) roomChats[data.roomId] = [];

    roomChats[data.roomId].push({
      userName: data.userName,
      message: data.message
    });

    io.to(data.roomId).emit("receive-message", {
      chats: roomChats[data.roomId],
      time: new Date().toLocaleString()
    });
  });
  socket.on("get-users",roomId=>{
    socket.emit("room-users",{
      users:users[roomId] || []
    })
  })
  socket.on("get-chats", (roomId) => {
    socket.emit("receive-message", {
      chats: roomChats[roomId] || []
    });
  });
  socket.on("leave-room", ({ roomId, userName }) => {
  socket.leave(roomId);

  if (!users[roomId]) return;

  users[roomId] = users[roomId].filter(
    u => u.socketId !== socket.id
  );

  // 🔥 Notify remaining users
  console.log(users[roomId])
  io.to(roomId).emit("room-users", users[roomId]);
});
 socket.on("disconnect", () => {
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
