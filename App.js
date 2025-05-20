const express = require("express");
const cors = require("cors");
const app = express();
const path = require('path');
const connectdb = require("./App/config/db");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const http = require('http');

const userRoutes = require("./App/routes/users/User");
const ProjectRoutes = require("./App/routes/projects/Project");
const MaterialRoutes = require("./App/routes/material/Material");
const NotificationRoutes = require("./App/routes/notifications/notification");
require('dotenv').config();

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

const server = http.createServer(app);

const { Server } = require("socket.io");

app.use(cookieParser()); 
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
        maxAge: 1000 * 60 * 30
    }
});

app.use(sessionMiddleware);

connectdb();

const PORT = process.env.PORT || 3000;

app.use('/Uploads/Documents', express.static(path.join(__dirname, 'App/Uploads/Documents')));
app.use("/user", userRoutes);
app.use("/Project", ProjectRoutes);
app.use("/Material", MaterialRoutes);
app.use("/notifications", NotificationRoutes);

app.get('/user/current', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ _id: req.session.user._id });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4200',
        methods: ["GET", "POST"],
        credentials: true
    }
});


const userEmailToSocketId = {}; 
const socketIdToUserEmail = {}; 

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on("connection", (socket) => {
    const req = socket.request;
    let userEmail = null;
    
    if (req.session && req.session.user) {
        userEmail = req.session.user.email; 
        
        if (userEmailToSocketId[userEmail] && userEmailToSocketId[userEmail] !== socket.id) {
            const oldSocketId = userEmailToSocketId[userEmail];
            const oldSocket = io.sockets.sockets.get(oldSocketId);
            
            if (oldSocket) {
                console.log(`Disconnecting previous socket ${oldSocketId} for user ${userEmail}`);
                oldSocket.disconnect(true);
            }
            
            delete socketIdToUserEmail[oldSocketId];
        }
        
        userEmailToSocketId[userEmail] = socket.id;
        socketIdToUserEmail[socket.id] = userEmail;
        
        console.log(`User ${userEmail} connected via socket ${socket.id}`);
        console.log("Current user mappings:", userEmailToSocketId);
    } else {
        // console.log(`Anonymous socket connected: ${socket.id}`);
    }

socket.on("call_user", ({ to, offer, from, fromSocketId }) => {
    console.log("call_user event received");
    console.log("From user email:", from);
    console.log("From socket ID:", socket.id);
    console.log("To user email:", to);
    
    const receiverSocketId = userEmailToSocketId[to];
    console.log("Receiver socket ID:", receiverSocketId);
    
    if (receiverSocketId) {
        const callerEmail = socketIdToUserEmail[socket.id] || from;
        console.log(`Sending incoming_call to ${receiverSocketId} from ${callerEmail}`);
        
        io.to(receiverSocketId).emit("incoming_call", {offer, from: callerEmail,  fromSocketId: socket.id });
    } else {
        console.log(`User ${to} is not connected`);
        socket.emit("call_failed", { to, reason: "User not available" });
    }
});

socket.on("answer_call", ({ to, answer, from, fromSocketId }) => {
    console.log("answer_call event received");
    console.log("From socket ID:", socket.id);
    console.log("To socket ID:", to);
    
    try {
        console.log(`Sending call_answered to ${to}`);
        io.to(to).emit("call_answered", { answer, from: socketIdToUserEmail[socket.id] || "unknown", fromSocketId: socket.id});
    } catch (err) {
        console.error("Error sending answer:", err);
    }
});

socket.on("ice_candidate", ({ to, candidate, from, fromSocketId }) => {
    console.log("ice_candidate event received");
    console.log("From socket ID:", socket.id);
    console.log("To socket ID:", to);
    
    try {
        console.log(`Sending ice_candidate to ${to}`);
        io.to(to).emit("ice_candidate", {candidate, from: socketIdToUserEmail[socket.id] || "unknown", fromSocketId: socket.id });
    } catch (err) {
        console.error("Error sending ICE candidate:", err);
    }
});

socket.on("disconnect", () => {
    const userEmail = socketIdToUserEmail[socket.id]; 
    
    if (userEmail) {
        console.log(`User ${userEmail} disconnected from socket ${socket.id}`);
        delete userEmailToSocketId[userEmail]; 
    } else {
        console.log(`Anonymous socket disconnected: ${socket.id}`);
    }
    
    delete socketIdToUserEmail[socket.id];
    console.log("Updated user mappings:", userEmailToSocketId); 
});

    socket.on("chat_message", ({ to, text, from }) => {
        console.log("Chat message received:", { from, to, text });
        console.log("Current socket mappings:", userEmailToSocketId);
        console.log("Looking for recipient:", to);
        
        const receiverSocketId = userEmailToSocketId[to];
        
        if (receiverSocketId) {
            console.log(`Sending chat message to ${to} (Socket ID: ${receiverSocketId})`);
            io.to(receiverSocketId).emit("chat_message", {text, from, timestamp: new Date().toISOString() });
        } else {
            console.log(`User ${to} is not connected to receive message`);
            socket.emit("message_status", { to, status: "undelivered",reason: "User offline" });
        }
    });
});

server.listen(PORT, () => {
    const port = server.address().port;
    console.log(`Server running at http://localhost:${port}`);
});