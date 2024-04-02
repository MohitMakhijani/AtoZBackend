const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const server = express();
const model = require("./model/product");
const cors = require('cors'); 
const Product = model.Product;
const path = require('path'); // Import the path module

server.use(express.json());
server.use(cors());

// Serve static files from the "public" directory
server.use(express.static(path.join(__dirname, 'public')));

server.post("/", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

server.get('/', async (req, res) => {
    const products = await Product.find();
    res.status(200).json({ products });
});

async function main() {
  await mongoose.connect("mongodb+srv://mohitmakhijani7:1234123121@cluster0.e2soqtd.mongodb.net/products");
  console.log("database connected");
}

main().catch((error) => console.log(error));

server.listen(8080, () => {
    console.log('Server running on http://localhost:8080');
});
