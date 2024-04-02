const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProductSchema = new Schema({
    title: String,
    body: String,
    id: Number,
  });
  exports.Product = mongoose.model('Product',ProductSchema);
  