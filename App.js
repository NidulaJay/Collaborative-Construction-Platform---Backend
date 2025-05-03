const express = require("express");
const cors = require("cors");
const app = express();
const connectdb = require("./App/config/db");
const session = require('express-session');
const cookieParser = require('cookie-parser');


const userRoutes = require("./App/routes/users/User")
const ProjectRoutes = require("./App/routes/projects/Project")
require('dotenv').config();

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));



app.use(cookieParser()); // if you're using cookies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
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
  }));

connectdb();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    const host = 'localhost'; 
    const port = server.address().port;
    console.log(`Server running at: http://${host}:${port}`);
  });

  

  app.use("/user", userRoutes);
  app.use("/Project", ProjectRoutes);



  
