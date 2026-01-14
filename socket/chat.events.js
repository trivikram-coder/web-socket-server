// socket/chat.events.js
const { roomChats } = require("./room.events");

module.exports = (io, socket) => {

  socket.on("send-message", ({ roomId, userName, message }) => {
    if (!roomChats[roomId]) roomChats[roomId] = [];

    roomChats[roomId].push({
      userName,
      message
    });
    
    // 🔥 realtime broadcast
    io.to(roomId).emit("receive-message", {
      chats: roomChats[roomId],
      time: new Date().toLocaleString()
    });
  });

};
