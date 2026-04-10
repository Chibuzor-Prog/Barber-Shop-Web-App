// backend/models/UserCredentials.js
// Stores authentication-related information.
// Passwords are hashed with bcryptjs — plain-text passwords are never stored.

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

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
    },
    role: {
      type:    String,
      enum:    { values: ['user', 'admin'], message: 'Role must be user or admin' },
      default: 'user',
    },
  },
  { timestamps: true }
);

// ── Instance method: verify a plain-text password ─────────────────────────────
userCredentialsSchema.methods.verifyPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Static helper: hash a plain-text password ─────────────────────────────────
userCredentialsSchema.statics.hashPassword = async function (plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
};

// Never return the password hash in JSON responses
userCredentialsSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('UserCredentials', userCredentialsSchema);
