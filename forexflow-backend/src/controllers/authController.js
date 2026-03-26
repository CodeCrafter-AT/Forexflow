const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// In production this should be in .env, but hardcoding for demo local environments
const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_key_123';

exports.register = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Give new users the $1,000,000 Whale Balance automatically
        const starterBalance = 1000000.0;

        db.run(`INSERT INTO users (username, password, balance) VALUES (?, ?, ?)`, 
            [username, hashedPassword, starterBalance], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Username already exists." });
                return res.status(500).json({ error: err.message });
            }
            
            // Create JWT token using the new user's insert ID
            const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
            res.json({ success: true, token, user: { id: this.lastID, username, balance: starterBalance } });
        });
    } catch (err) {
        res.status(500).json({ error: "Server error during registration." });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found." });
        
        // Ensure legacy tracer accounts without passwords don't crash the compare sequence
        if (!user.password) return res.status(400).json({ error: "Legacy account identified. Please register a new Vault Account." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, user: { id: user.id, username: user.username, balance: user.balance } });
    });
};
