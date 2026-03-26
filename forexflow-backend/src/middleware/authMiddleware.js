const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'vault_secret_key_123';

const protect = (req, res, next) => {
    let token;
    
    // Check if the bearer token is attached natively in the request header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return res.status(401).json({ error: "Not authorized to access this route. Token missing." });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Mount the native user object `{ id, username, iat, exp }` to req.user for passing
        next();
    } catch (err) {
        return res.status(401).json({ error: "Not authorized. Session invalid or expired." });
    }
};

module.exports = protect;
