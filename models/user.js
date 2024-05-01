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
});

const User = mongoose.model('User', userSchema);

module.exports = User;
