const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  hashedPassword: String,
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer'
  },
  points: {
    type: Number,
    default: 0
  },

});

const User = mongoose.model('User', userSchema);

module.exports = User;
