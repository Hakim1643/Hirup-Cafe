const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE CONFIGURATION ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- SERVE FRONTEND STATIC ASSETS ---
app.use(express.static(path.join(__dirname, 'public')));

// --- DATABASE CONNECTION PIPELINE ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing from your .env file!");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("🍃 MongoDB Cloud Database connected successfully!"))
        .catch(err => console.error("❌ MongoDB connection error:", err));
}

// --- 🛠️ ROUTES MOUNTING LAYER ---
// This mounts all the registration logic onto the base path URL '/api/auth'
app.use('/api/auth', require('./routes/auth'));

// --- CORE API STATUS CHECK ---
app.get('/api/status', (req, res) => {
    res.json({ message: "Hirup Cafe Backend Engine is running smoothly! ☕" });
});

// --- FALLBACK INTERCEPT ROUTE ---
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- INITIALIZE LISTENER ---
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Hirup Cafe server is cooking on port ${PORT}`);
    console.log(`👉 Open http://localhost:${PORT} in your web browser!`);
    console.log(`===================================================`);
});