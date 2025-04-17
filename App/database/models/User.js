const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName: {type: String, required: true, minlength: 2},
  lastName: {type: String, required: false, minlength: 2},
  email: {type: String, required: true, unique: true, lowercase: true},
  phoneNumber: {type: String, required: true},
  username: {type: String, required: false},
  birthdate: {type: Date, required: true,},
  gender: {type: String, required: true, enum: ['Male', 'Female', 'Other']},
  nic: {type: String, required: true},
  address: {type: String, required: false, minlength: 5,},
  userRole: {type: String, required: true, enum: ['user', 'contractor', 'architecture', 'supplier'], default: 'user'},
  city: {type: String, required: true},
  state: {type: String, required: true},
  Zip: {type: String, required: true},
  password: {type: String, required: true, minlength: 6}
});

const User = mongoose.model('User', userSchema);

module.exports = User;