
const express         = require('express');
const router          = express.Router();
const mongoose        = require('mongoose');
const UserCredentials = require('../models/UserCredentials');
const UserProfile     = require('../models/UserProfile');
const { isNonEmptyString } = require('../utils/validators');

// Added simple email validation helper
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

// Added helper to normalize email consistently
const normalizeEmail = (email) => email.toLowerCase().trim();

// Added helper to validate Mongo ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  let cred = null;

  try {
    const { name, email, password, phone, contactInfo, preferences } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    if (!isNonEmptyString(name))  return res.status(400).json({ message: 'Name must be a non-empty string' });
    if (!isNonEmptyString(email)) return res.status(400).json({ message: 'Email must be a non-empty string' });
    if (email.includes('@') && !EMAIL_REGEX.test(normalizeEmail(email))) {
      return res.status(400).json({ message: 'Email format is invalid' });
    }
    if (password.length < 4)      return res.status(400).json({ message: 'Password must be at least 4 characters' });

    // Added optional field validation
    if (phone && typeof phone !== 'string') {
      return res.status(400).json({ message: 'Phone must be a string' });
    }
    if (contactInfo && typeof contactInfo !== 'string') {
      return res.status(400).json({ message: 'Contact info must be a string' });
    }
    if (preferences && (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences))) {
      return res.status(400).json({ message: 'Preferences must be an object' });
    }

    const existing = await UserCredentials.findOne({ email: normalizeEmail(email) });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Hash password before storing
    const passwordHash = await UserCredentials.hashPassword(password);

    cred = await UserCredentials.create({
      email: normalizeEmail(email),
      passwordHash,
      role: 'user',
    });

    const profile = await UserProfile.create({
      credentialId: cred._id,
      email:        cred.email,
      fullName:     name.trim(),
      phone:        phone || '',
      contactInfo:  contactInfo || '',
      preferences:  preferences || {},
    });

    res.status(200).json({
      message: 'User registered',
      user: {
        id:      cred._id,
        name:    profile.fullName,
        email:   cred.email,
        role:    cred.role,
        phone:   profile.phone,
        contactInfo: profile.contactInfo,
        preferences: profile.preferences,
      },
    });
  } catch (err) {
    // Added cleanup so credentials do not remain if profile creation fails
    if (cred && cred._id) {
      try {
        await UserCredentials.deleteOne({ _id: cred._id });
      } catch (cleanupErr) {
        console.error('Register cleanup error:', cleanupErr);
      }
    }

    // Handle Mongoose unique constraint violation
    if (err.code === 11000) {
      return res.status(400).json({message: 'User already exists' });
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

    if (!isNonEmptyString(email)) {
      return res.status(400).json({ message: 'Email must be a non-empty string' });
    }

    if (email.includes('@') && !EMAIL_REGEX.test(normalizeEmail(email))) {
      return res.status(400).json({ message: 'Email format is invalid' });
    }

    const cred = await UserCredentials.findOne({ email: normalizeEmail(email) });
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
        phone: profile ? profile.phone : '',
        contactInfo: profile ? profile.contactInfo : '',
        preferences: profile ? profile.preferences : {},
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /auth/profile/:id ─────────────────────────────────────────────────────
router.get('/profile/:id', async (req, res) => {
  try {
    // Added ObjectId validation for safer lookups
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid profile id' });
    }

    const profile = await UserProfile.findOne({ credentialId: req.params.id });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      message: 'Profile fetched successfully',
      profile,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /auth/profile/:id ─────────────────────────────────────────────────────
router.put('/profile/:id', async (req, res) => {
  try {
    const { fullName, phone, contactInfo, preferences } = req.body;

    // Added ObjectId validation for safer updates
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid profile id' });
    }

    const updateFields = {};

    if (fullName !== undefined) {
      if (!isNonEmptyString(fullName)) {
        return res.status(400).json({ message: 'Full name must be a non-empty string' });
      }
      updateFields.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ message: 'Phone must be a string' });
      }
      updateFields.phone = phone;
    }

    if (contactInfo !== undefined) {
      if (typeof contactInfo !== 'string') {
        return res.status(400).json({ message: 'Contact info must be a string' });
      }
      updateFields.contactInfo = contactInfo;
    }

    if (preferences !== undefined) {
      if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
        return res.status(400).json({ message: 'Preferences must be an object' });
      }
      updateFields.preferences = preferences;
    }

    // Added protection against empty update requests
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    const updatedProfile = await UserProfile.findOneAndUpdate(
      { credentialId: req.params.id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;