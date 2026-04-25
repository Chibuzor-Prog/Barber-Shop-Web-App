

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// Added helper so email cleanup is consistent
const normalizeEmail = (email) => email.toLowerCase().trim();

const userCredentialsSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      trim:     true,
      lowercase: true,
      maxlength: [254, 'Email must be 254 characters or fewer'],
      match: [/^\S+@\S+\.\S+$/, 'Email format is invalid'],
    },
    passwordHash: {
      type:     String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password hash is invalid'],
    },
    role: {
      type:    String,
      enum:    { values: ['user', 'admin'], message: 'Role must be user or admin' },
      default: 'user',
    },
  },
  { timestamps: true }
);

// Added index settings for faster unique email lookups
userCredentialsSchema.index({ email: 1 }, { unique: true });

// Added pre-validation cleanup for email
userCredentialsSchema.pre('validate', function (next) {
  if (this.email && typeof this.email === 'string') {
    this.email = normalizeEmail(this.email);
  }
  next();
});

// ── Instance method: verify a plain-text password ─────────────────────────────
userCredentialsSchema.methods.verifyPassword = async function (plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
    return false;
  }
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Static helper: hash a plain-text password ─────────────────────────────────
userCredentialsSchema.statics.hashPassword = async function (plainPassword) {
  if (typeof plainPassword !== 'string' || plainPassword.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

// Added static helper for normalized email lookups
userCredentialsSchema.statics.normalizeEmail = function (email) {
  return normalizeEmail(email);
};

// Never return the password hash in JSON responses
userCredentialsSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

// Added transform for object conversion too
userCredentialsSchema.set('toObject', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('UserCredentials', userCredentialsSchema);