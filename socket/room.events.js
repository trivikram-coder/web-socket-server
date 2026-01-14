const users = {};      // { roomId: { userName: [socketId] } }
const roomChats = {}; // unchanged
const {roomCode}=require("./editor.events")
module.exports = (io, socket) => {

  // -------------------------
  // JOIN ROOM
  // -------------------------
  socket.on("join-room", ({ roomId, userName }) => {
    socket.join(roomId);
    console.log(userName+" joined the room : "+roomId)
    if(roomCode[roomId]){
      socket.to(roomId).emit("code-sent",roomCode[roomId])
    }
    if (!users[roomId]) users[roomId] = {};
    if (!roomChats[roomId]) roomChats[roomId] = [];

    // 🔥 create user entry once
    if (!users[roomId][userName]) {
      users[roomId][userName] = [];
    }

    // 🔥 add socketId if not present
    if (!users[roomId][userName].includes(socket.id)) {
      users[roomId][userName].push(socket.id);
    }

    // emit UNIQUE usernames list
    io.to(roomId).emit("room-users", Object.keys(users[roomId]));

    // send history only to this socket
    socket.emit("receive-message", {
      chats: roomChats[roomId]
    });
  });

  // -------------------------
  // LEAVE ROOM
  // -------------------------
  socket.on("leave-room", ({ roomId, userName }) => {
    if (!users[roomId]?.[userName]) return;

    users[roomId][userName] =
      users[roomId][userName].filter(id => id !== socket.id);

    // 🔥 remove username only if no sockets left
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

// export for chat.events.js
module.exports.roomChats = roomChats;
