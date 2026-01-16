const users = {};      // { roomId: { userName: [socketId] } }
const roomChats = {};
const { roomCode } = require("./editor.events");

module.exports = (io, socket) => {

  // -------------------------
  // JOIN ROOM
  // -------------------------
  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);
    console.log(`${userName} joined room: ${roomId}`);

    // ✅ SEND CODE ONLY TO JOINING USER
    if (roomCode[roomId]) {
      socket.emit("code-sent", roomCode[roomId]);
    }

    if (!users[roomId]) users[roomId] = {};
    if (!roomChats[roomId]) roomChats[roomId] = [];

    if (!users[roomId][userName]) {
      users[roomId][userName] = [];
    }

    if (!users[roomId][userName].includes(socket.id)) {
      users[roomId][userName].push(socket.id);
    }

    // broadcast unique users list
    io.to(roomId).emit("room-users", Object.keys(users[roomId]));

    // send chat history only to this socket
    socket.emit("receive-message", {
      chats: roomChats[roomId],
    });
  });

  // -------------------------
  // LEAVE ROOM
  // -------------------------
  socket.on("leave-room", ({ roomId, userName }) => {
    if (!users[roomId]?.[userName]) return;

    users[roomId][userName] =
      users[roomId][userName].filter(id => id !== socket.id);

    if (users[roomId][userName].length === 0) {
      delete users[roomId][userName];
    }

    socket.leave(roomId);
    io.to(roomId).emit("room-users", Object.keys(users[roomId]));
  });

  // -------------------------
  // DISCONNECT
  // -------------------------
  socket.on("disconnect", () => {
    for (const roomId in users) {
      for (const userName in users[roomId]) {
        users[roomId][userName] =
          users[roomId][userName].filter(id => id !== socket.id);

        if (users[roomId][userName].length === 0) {
          delete users[roomId][userName];
        }
      }
      io.to(roomId).emit("room-users", Object.keys(users[roomId]));
    }
  });
};

module.exports.roomChats = roomChats;
