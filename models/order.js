const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    items: [{
        itemId: {
            type: Schema.Types.ObjectId,
            ref: 'Item', // Reference to the Item model
        },
        quantity: {
            type: Number,
            min: 1,     // Minimum value allowed is 1
            max: 10     // Maximum value allowed is 10
        },
    }],
    purchased: {
        type: Boolean,
        default: false // Set default value to false
    }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
