const express = require("express");
const cors = require("cors");
const app = express();
const connectdb = require("./App/config/db");

connectdb();