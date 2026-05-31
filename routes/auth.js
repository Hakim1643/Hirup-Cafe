const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User'); // Import our user structural blueprint

// 1. CONFIGURE THE EMAIL TRANSPORTER (ONCE AT THE TOP)
// 1. CONFIGURE THE EMAIL TRANSPORTER (SECURE VERSION)
// 1. CONFIGURE THE EMAIL TRANSPORTER (CLOUD SERVER FIX)
// 1. CONFIGURE THE EMAIL TRANSPORTER (FORCE IPv4 ROUTING)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // 🔥 THE MAGIC FIX: Forces the server to use IPv4 instead of IPv6
    family: 4 
});

// ==========================================
// 📝 POST ROUTE: REGISTER A NEW CAFE MEMBER
// URL Endpoint: http://localhost:5000/api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Basic validation check: Did they fill in all fields?
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill in all layout fields!" });
        }

        // 2. Check if user already exists in our MongoDB system
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "An account with this email already exists!" });
        }

        // 3. ENCRYPTION LAYER: Hash the user's password using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Create the new user document instance
        const newUser = new User({
            username,
            email,
            password: hashedPassword // Save the secure hashed version, never plain text!
        });

        // 5. Commit and save to MongoDB Cloud
        await newUser.save();

        // 6. SET UP THE AUTOMATED FEEDBACK EMAIL LAYOUT
        const mailOptions = {
            from: '"Hirup Cafe" <hakim.hishammdtahir@gmail.com>',
            to: email, // Sends it directly to the user's registered email address
            subject: 'Welcome to Hirup Cafe! ☕',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 35px; border-radius: 16px; background-color: #ffffff; color: #2c313a;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1a3c6d; margin-bottom: 5px; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Breathe in, Hirup deeply.</h2>
                        <p style="font-style: italic; color: #5a6270; margin-top: 0;">Your digital loyalty profile is now active.</p>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <p>Hi <strong>${username}</strong>,</p>
                    <p>Thank you for registering! Next time you visit us in <strong>Seksyen 9, Shah Alam</strong>, don't forget to match your signature brews or play our order card game!</p>
                    
                    <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2b6cb0; margin: 25px 0;">
                        <p style="margin: 0; font-size: 0.9rem; color: #4a5568;">
                            <strong>Tip:</strong> You can now log into your profile instantly using your registered email: <code>${email}</code>
                        </p>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="font-size: 0.85rem; color: #718096; line-height: 1.5; margin: 0;">
                        Regards,<br>
                        <strong>The Hirup Cafe Team</strong>
                    </p>
                </div>
            `
        };

        // 7. TRIGGER THE EMAIL SEND PROCESS IN THE BACKGROUND
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("❌ Email failed to send:", error);
            } else {
                console.log("🚀 Confirmation email dispatched: " + info.response);
            }
        });

        // 8. Respond back to your front-end script
        return res.status(201).json({ 
            message: "Welcome to the club! Account created successfully! ☕✨",
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });

    } catch (error) {
        console.error("❌ Registration Endpoint Error:", error);
        return res.status(500).json({ message: "Server engine ran into an error creating your account." });
    }
});

// ==========================================
// 🔐 POST ROUTE: LOGIN AN EXISTING MEMBER
// URL Endpoint: http://localhost:5000/api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation check
        if (!email || !password) {
            return res.status(400).json({ message: "Please enter both email and password." });
        }

        // 2. Locate user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 3. Verify password match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 4. Create a Secret JWT Token Session Key
        const secretKey = process.env.JWT_SECRET || 'temporary_cafe_secret_key';
        
        const token = jwt.sign(
            { id: user._id, username: user.username },
            secretKey,
            { expiresIn: '1h' } // User remains logged in for 1 hour
        );

        // 5. Send back success data and token!
        return res.status(200).json({
            message: `Welcome back, ${user.username}! ☕`,
            token,
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error("❌ Login Endpoint Error:", error);
        return res.status(500).json({ message: "Server engine ran into a login error." });
    }
});

// ===================================================
// 🛡️ SECURITY MIDDLEWARE: VALIDATE MEMBER LOGIN TOKEN
// ===================================================
function verifyToken(req, res, next) {
    // Look for the token inside the incoming request headers
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
        return res.status(403).json({ message: "Access denied. No session token provided!" });
    }

    try {
        // Split "Bearer <token>" to extract just the token string
        const token = bearerHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET || 'temporary_cafe_secret_key';
        
        // Decrypt and verify token validity
        const verifiedData = jwt.verify(token, secretKey);
        req.user = verifiedData; // Store user details inside the request object
        next(); // Hand control over to the next dashboard block
    } catch (error) {
        return res.status(401).json({ message: "Session expired or invalid token. Please log in again." });
    }
}

// ===================================================
// 🎁 SECURE API ROUTE: FETCH MEMBER CONTENT
// URL Endpoint: http://localhost:5000/api/auth/dashboard
// ===================================================
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        // Pull fresh information from the database using the ID inside the secure token
        const memberProfile = await User.findById(req.user.id).select('-password'); // Exclude password from payload
        
        return res.status(200).json({
            message: "Welcome inside the exclusive Hirup Lounge! 🤫",
            memberSince: memberProfile.createdAt,
            pointsBalance: 150 // Mocking some initial club loyalty points for flavor!
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching member portal data." });
    }
});

module.exports = router;