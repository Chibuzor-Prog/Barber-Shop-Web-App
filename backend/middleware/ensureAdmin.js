// backend/middleware/ensureAdmin.js
/**
 * Express middleware to ensure the user is authenticated and has admin role.
 * Assumes req.user is set by authentication middleware (e.g., JWT or session).
 */
module.exports = function ensureAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
