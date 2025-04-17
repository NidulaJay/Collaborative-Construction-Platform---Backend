const mongoose = require('mongoose');

const uri = "mongodb+srv://CCPBACKEND:<db_password>@cluster0.auilqif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const options = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 10000,
};

async function connectdb() {
  try {
    await mongoose.connect(uri, options);
    console.log("Successfully connected to MongoDB Atlas via Mongoose!");
  } catch (err) {
    console.log("Error connecting to MongoDB Atlas:", err);
  }
}

connectdb().catch(console.dir);

module.exports = connectdb;
