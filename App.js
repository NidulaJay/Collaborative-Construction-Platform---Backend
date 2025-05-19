const express = require("express");
const cors = require("cors");
const app = express();
const path = require('path');
const connectdb = require("./App/config/db");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');



const userRoutes = require("./App/routes/users/User")
const ProjectRoutes = require("./App/routes/projects/Project")
require('dotenv').config();

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

// 👇 Create HTTP server for both Express and Socket.IO
const server = http.createServer(app);

// 👇 Attach Socket.IO to that server
const { Server } = require("socket.io");


app.use(cookieParser()); // if you're using cookies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const sessionMiddleware = session({
    secret: '1b522660fd91c88df55cd68e1e7d208a47b620b2e9b06d1c9b6d6d472d1d7e109df9f833105873e2dab97860d68530bce196adefb9d4770c67cf28c65146af6f', 
    resave: false,             
    saveUninitialized: true,   
    rolling: true,
    cookie: {
        secure: false,
        httpOnly: true,
        // maxAge: 1000 * 60 * 60 * 24 // 1 day
        // maxAge: 1000 * 60 * 60  // 1 hour
        maxAge: 1000 * 60 * 30  // 30 minutes
    }
  });

app.use(sessionMiddleware);

connectdb();

const PORT = process.env.PORT || 3000;

app.use('/Uploads', express.static(path.join(__dirname, 'App/Uploads/Documents')));
app.use("/user", userRoutes);
app.use("/Project", ProjectRoutes);


const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4200',
        methods: ["GET", "POST"],
        credentials: true
    }
});

// 👇 Socket.IO logic
const users = {}; // { userId: socketId }

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});


io.on("connection", (socket) => {
  const req = socket.request;

  if (req.session && req.session.user) {
    const userId = req.session.user._id; 
    
    if (users[userId] && users[userId] !== socket.id) {
      const oldSocketId = users[userId];
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.disconnect(true);
        console.log(`Disconnected previous socket ${oldSocketId} for user ${userId}`);
      }
    }

    users[userId] = socket.id;
    console.log(`User ${userId} connected via socket ${socket.id}`);

  } else {
    console.log("No user session found in socket connection");
  }

  socket.on("call_user", ({ to, offer, from }) => {
    console.log("call_user event received");
    console.log("From socket ID:", socket.id);
    console.log("To user ID:", to);
    console.log("Current users map:", users);
    const receiverSocketId = users[to];
    console.log("Resolved receiverSocketId:", receiverSocketId);
    
    try {
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("incoming_call", {
          offer, // already destructured correctly
          from   // same here
        });
      }
    } catch (err) {
      console.error(err);
    }
  });
  

  socket.on("disconnect", () => {
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];
        console.log('socket disconnected');
        break;
      }
    }
  });

  socket.on("answer_call", ({ to, answer }) => {
    const receiverSocketId = users[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call_answered", { from: socket.id, answer });
    }
  });
  
  socket.on("ice_candidate", ({ to, candidate }) => {
    const receiverSocketId = users[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice_candidate", { from: socket.id, candidate });
    }
  });
  
});

// const server = app.listen(PORT, () => {
//     const host = 'localhost'; 
//     const port = server.address().port;
//     console.log(`Server running at: http://${host}:${port}`);
//   });

  server.listen(PORT, () => {
    const port = server.address().port;
    console.log(`Server running at http://localhost:${port}`);
});
  




  
