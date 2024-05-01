const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    items: [{
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'Item' // Reference to the Item model
        },
        quantity: Number
    }],
});

const Order = mongoose.model('Order', userSchema);

module.exports = Order;
