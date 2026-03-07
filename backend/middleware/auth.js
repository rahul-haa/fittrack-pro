/**
 * Auth Middleware
 * Verifies JWT access tokens and attaches user info to request.
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

/**
 * Authenticate requests via Bearer token.
 * Attaches req.user = { id, email, role } on success.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please refresh.' });
        }
        return res.status(403).json({ error: 'Invalid token.' });
    }
}

/**
 * Role-based access control middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'trainer')
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions.' });
        }
        next();
    };
}

module.exports = { authenticate, authorize };
