const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const runCode=require("./controller/runcode")
const app = express();
const dotenv=require("dotenv")
dotenv.config()
const cors=require("cors")
const server = http.createServer(app);
app.use(cors(origin=process.env.CLIENT_URL))
app.use(express.json())
app.post("/run",runCode)

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

const socketHandler=require("./socket")
socketHandler(io)
app.get("/",(req,res)=>{
  res.send("Socket and code runner service is running 🚀🚀🚀")
})
// Start server
server.listen(process.env.PORT, () => {
  console.log("🚀 Server running on port ",process.env.PORT);
});
