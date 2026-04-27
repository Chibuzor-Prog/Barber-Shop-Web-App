// backend/middleware/authenticateJWT.js
const jwt = require('jsonwebtoken');
const UserCredentials = require('../models/UserCredentials');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

module.exports = async function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach user info to req.user
    const user = await UserCredentials.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { id: user._id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
