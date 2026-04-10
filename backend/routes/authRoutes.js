// backend/routes/authRoutes.js
const express         = require('express');
const router          = express.Router();
const UserCredentials = require('../models/UserCredentials');
const UserProfile     = require('../models/UserProfile');
const { isNonEmptyString } = require('../utils/validators');

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    if (!isNonEmptyString(name))  return res.status(400).json({ message: 'Name must be a non-empty string' });
    if (!isNonEmptyString(email)) return res.status(400).json({ message: 'Email must be a non-empty string' });
    if (password.length < 4)      return res.status(400).json({ message: 'Password must be at least 4 characters' });

    const existing = await UserCredentials.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Hash password before storing
    const passwordHash = await UserCredentials.hashPassword(password);

    const cred = await UserCredentials.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
    });

    const profile = await UserProfile.create({
      credentialId: cred._id,
      email:        cred.email,
      fullName:     name.trim(),
      phone:        req.body.phone || '',
      preferences:  {},
    });

    res.json({
      message: 'User registered',
      user: {
        id:      cred._id,
        name:    profile.fullName,
        email:   cred.email,
        role:    cred.role,
      },
    });
  } catch (err) {
    // Handle Mongoose unique constraint violation
    if (err.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cred = await UserCredentials.findOne({ email: email.toLowerCase().trim() });
    if (!cred) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await cred.verifyPassword(password);
    if (!valid)  return res.status(401).json({ message: 'Invalid credentials' });

    // Fetch linked profile for the user's display name
    const profile = await UserProfile.findOne({ credentialId: cred._id });

    res.json({
      message: 'Login successful',
      user: {
        id:    cred._id,
        name:  profile ? profile.fullName : cred.email,
        email: cred.email,
        role:  cred.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
