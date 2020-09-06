const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  local: {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  facebook: {
    id:     String,
    token:  String,
    email:  String,
    name:   String
  },
  google: {
    id:     String,
    token:  String,
    email:  String,
    name:   String
  }
});

const People = mongoose.model('People', UserSchema);

module.exports = People;