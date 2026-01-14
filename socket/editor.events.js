const roomCode = {};

const socketFun = (io, socket) => {
  socket.on("code-change", ({ roomId, userName, code }) => {
    roomCode[roomId]=code
    console.log(roomCode)
    socket.to(roomId).emit("code-sent", code);
  });
};
module.exports={socketFun,roomCode}