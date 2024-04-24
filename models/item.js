const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const itemSchema = new Schema({
    name: String,
    description: String,
    price: String,
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
