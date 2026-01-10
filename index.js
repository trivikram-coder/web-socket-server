
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);
  socket.on("send-message",(data)=>{
    console.log(data)
    if(!data.room){
      console.log("Sent")
      socket.broadcast.emit("receive-message",data.message)
      return;
    }else{
    socket.to(data.room).emit("receive-message",data.message)
    }
  })
  socket.on("join-room",room=>{
    socket.join(room)
    console.log(`User joined in room ${room}`)
  })
  socket.on("change-code",data=>{
    console.log(data.code)
    socket.to(data.roomId).emit("receive-code",data)
  })
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected`);
  });
});

server.listen(3000, () => {
  console.log("Server running successfully on port 3000");
});
