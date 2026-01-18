const roomCode = {}; // roomId -> { code, language }

const socketFun = (io, socket) => {
  socket.on("code-change", ({ roomId, userName, code, language }) => {
    roomCode[roomId] = { code, language };

    

    // send to others in the room
    socket.to(roomId).emit("code-sent", { code, language });
  });
};

module.exports = { socketFun, roomCode };
