const roomEvents = require("./room.events");
const chatEvents = require("./chat.events");

const {socketFun}=require("./editor.events")
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    roomEvents(io, socket);
    chatEvents(io, socket);
    socketFun(io, socket);
  });
};
