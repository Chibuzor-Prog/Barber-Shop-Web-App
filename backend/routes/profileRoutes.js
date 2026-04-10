// backend/routes/profileRoutes.js
// Handles user profile retrieval and updates.
// GET  /profile/:credentialId  — fetch profile (joined with role from UserCredentials)
// PATCH /profile/:credentialId — update editable fields (phone, contactInfo, fullName)

const express         = require('express');
const router          = express.Router();
const UserProfile     = require('../models/UserProfile');
const UserCredentials = require('../models/UserCredentials');

// ── GET /profile/:credentialId ────────────────────────────────────────────────
// Returns the full profile for a user, including role from UserCredentials.
router.get('/:credentialId', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ credentialId: req.params.credentialId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Fetch role from UserCredentials
    const cred = await UserCredentials.findById(req.params.credentialId);

    res.json({
      id:          profile._id,
      credentialId:profile.credentialId,
      email:       profile.email,
      fullName:    profile.fullName,
      phone:       profile.phone,
      contactInfo: profile.contactInfo,
      preferences: profile.preferences,
      role:        cred ? cred.role : 'user',
      updatedAt:   profile.updatedAt,
    });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Profile not found' });
    console.error('GET /profile/:credentialId error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /profile/:credentialId ──────────────────────────────────────────────
// Updates editable profile fields. Only phone, contactInfo, and fullName are
// user-editable — email and role are managed by auth, not this route.
router.patch('/:credentialId', async (req, res) => {
  try {
    const { fullName, phone, contactInfo, preferences } = req.body;

    const profile = await UserProfile.findOne({ credentialId: req.params.credentialId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Validate and apply updates
    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length === 0) {
        return res.status(400).json({ message: 'Full name must be a non-empty string' });
      }
      if (fullName.trim().length > 100) {
        return res.status(400).json({ message: 'Full name must be 100 characters or fewer' });
      }
      profile.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      if (typeof phone !== 'string') {
        return res.status(400).json({ message: 'Phone must be a string' });
      }
      if (phone.trim().length > 20) {
        return res.status(400).json({ message: 'Phone must be 20 characters or fewer' });
      }
      profile.phone = phone.trim();
    }

    if (contactInfo !== undefined) {
      if (typeof contactInfo !== 'string') {
        return res.status(400).json({ message: 'Contact information must be a string' });
      }
      if (contactInfo.trim().length > 300) {
        return res.status(400).json({ message: 'Contact information must be 300 characters or fewer' });
      }
      profile.contactInfo = contactInfo.trim();
    }

    if (preferences !== undefined && typeof preferences === 'object') {
      profile.preferences = { ...profile.preferences, ...preferences };
    }

    await profile.save();

    // Fetch role for response
    const cred = await UserCredentials.findById(req.params.credentialId);

    res.json({
      message: 'Profile updated',
      profile: {
        id:          profile._id,
        credentialId:profile.credentialId,
        email:       profile.email,
        fullName:    profile.fullName,
        phone:       profile.phone,
        contactInfo: profile.contactInfo,
        preferences: profile.preferences,
        role:        cred ? cred.role : 'user',
        updatedAt:   profile.updatedAt,
      },
    });
  } catch (err) {
    if (err.name === 'CastError')      return res.status(404).json({ message: 'Profile not found' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors)[0].message });
    console.error('PATCH /profile/:credentialId error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
