// backend/models/UserProfile.js
// Stores user-related details.
// Linked to UserCredentials via credentialId (ObjectId ref) AND email (denormalised).
// The email field is denormalised here for convenience so profile queries don't
// always need to join UserCredentials — both fields are kept in sync on register.

const mongoose = require('mongoose');

// Added helper for consistent email normalization
const normalizeEmail = (email) => email.toLowerCase().trim();

const userProfileSchema = new mongoose.Schema(
  {
    // ── Foreign key: references UserCredentials._id ────────────────────────────
    credentialId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'UserCredentials',
      required: [true, 'credentialId is required'],
      unique:   true,
    },

    // ── Email — denormalised from UserCredentials for convenient queries ────────
    // Referenced from usercredentials (same value, kept in sync on register).
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      trim:      true,
      lowercase: true,
      maxlength: [254, 'Email must be 254 characters or fewer'],
      match:     [/^\S+@\S+\.\S+$/, 'Email format is invalid'], // Added validation
    },

    // ── Core profile fields ────────────────────────────────────────────────────
    fullName: {
      type:      String,
      required:  [true, 'Full name is required'],
      trim:      true,
      maxlength: [100, 'Full name must be 100 characters or fewer'],
    },

    phone: {
      type:      String,
      trim:      true,
      maxlength: [20, 'Phone must be 20 characters or fewer'],
      default:   '',
    },

    // ── Contact information — editable by the user from the profile panel ───────
    // Free-text address / contact details the user wants to store.
    contactInfo: {
      type:      String,
      trim:      true,
      maxlength: [300, 'Contact information must be 300 characters or fewer'],
      default:   '',
    },

    // ── Preferences — flexible JSON for notification settings, language, etc. ───
    preferences: {
      type:    mongoose.Schema.Types.Mixed,
      default: { notifications: true, language: 'en' },
    },
  },
  { timestamps: true }
);

// Index on email for fast profile lookup by email
userProfileSchema.index({ email: 1 });

// Added index for credentialId for faster joins/lookups
userProfileSchema.index({ credentialId: 1 });

// Added pre-validation cleanup to normalize email
userProfileSchema.pre('validate', function (next) {
  if (this.email && typeof this.email === 'string') {
    this.email = normalizeEmail(this.email);
  }
  next();
});

// Added validation to ensure preferences is always a valid object (not array/null)
userProfileSchema.pre('save', function (next) {
  if (
    this.preferences &&
    (typeof this.preferences !== 'object' ||
     this.preferences === null ||
     Array.isArray(this.preferences))
  ) {
    return next(new Error('Preferences must be a valid object'));
  }
  next();
});

// Added transform to clean output if needed in future (safe extension point)
userProfileSchema.set('toJSON', {
  transform(doc, ret) {
    return ret;
  },
});

module.exports = mongoose.model('UserProfile', userProfileSchema);