const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require('cors');
const path = require('path');

const server = express();
server.use(express.json());
server.use(cors());
server.use(express.static(path.join(__dirname, 'public')));

// Middleware for error handling
server.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error" });
});

// Logging middleware for debugging
server.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// User schema and model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    phoneNo: { type: String, unique: true, sparse: true },
    Aadhar: { type: String, unique: true, sparse: true },
    profilePicture: { type: String },
    Address: { type: String },
});

const roomSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    price: { type: String, required: true, unique: true },
    Address: { type: String, required: true, unique: true },
    persons: { type: String, required: true, unique: true },
    Pictures: [{ type: String, required: true }], // Array of strings for pictures
    Video: [{ type: String, required: true, unique: true }],
    Description: { type: String, required: true, unique: true },
});

const feedbackSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    feedBack: { type: String, required: true, unique: true }
});

const Room = mongoose.model("Rooms", roomSchema);
const User = mongoose.model('User', userSchema);
const feedbacks = mongoose.model('feedbacks', feedbackSchema);

server.post("/postRoom", async (req, res) => {
    try {
        const { email, Address, persons, Pictures, Video, Description, price } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "User does not exist" });
        }

        // Create a new room
        const room = new Room({
            email,
            Address,
            persons,
            Pictures,
            Video,
            Description,
            price
        });

        // Save the room to the database
        await room.save();

        res.status(201).json({ message: "Room posted successfully" });
    } catch (error) {
        console.error('Posting error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get all rooms route
server.get("/rooms", async (req, res) => {
    try {
        // Fetch all rooms from the database
        const rooms = await Room.find();

        // Send the list of rooms as a JSON response
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

server.get('/', (req, res) => {
    res.json({
        message: "jnjsw",
    })
})
server.post("/signup", async (req, res) => {
    try {
        const { email, name, password, phoneNo, Aadhar, profilePicture, Address } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with hashed password and other details
        const user = new User({
            email,
            name,
            password: hashedPassword, // Store hashed password
            phoneNo,
            Aadhar,
            profilePicture,
            Address
        });
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, message: "User created successfully" });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Setup profile route
server.patch("/setup", async (req, res) => {
    try {
        const { email, phoneNo, Aadhar, profilePicture, Address } = req.body;

        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({ message: "User does not exist" });
        }

        // Update user profile fields if they are provided
        if (phoneNo) {
            existingUser.phoneNo = phoneNo;
        }
        if (Aadhar) {
            existingUser.Aadhar = Aadhar;
        }
        if (profilePicture) {
            existingUser.profilePicture = profilePicture;
        }
        if (Address) {
            existingUser.Address = Address;
        }

        await existingUser.save();

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error('Setup profile error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Feedback route
server.post('/postFeedback', async (req, res) => {
    try {
        const { email, feedBack } = req.body;

        // Create new feedback
        const feedback = new feedbacks({ email, feedBack });

        // Save the feedback to the database
        await feedback.save();

        res.status(201).json({ message: "Feedback submitted successfully" });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

server.get('/feedback', async (req, res) => {
    try {
        // Fetch all rooms from the database
        const feedback = await feedbacks.find();

        // Send the list of rooms as a JSON response
        res.status(200).json(feedback);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login route
server.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send the entire user object in the response
        res.status(200).json({ token, user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Add other options if needed
        });
        console.log("Database connected");
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

main();

server.listen(process.env.PORT, () => {
    console.log('Server running on http://localhost:8080');
});
server.use('/', (req, res) => {
    res.json({
        message: "WELCOME"
    });
});