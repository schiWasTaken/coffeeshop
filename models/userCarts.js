const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userCartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    itemId: {
        type: Schema.Types.ObjectId,
        ref: 'Item' // Reference to the Item model
    },
    quantity: {
        type: Number,
        default: 0
    }
});

const UserCart = mongoose.model('UserCart', userCartSchema);

module.exports = UserCart;
