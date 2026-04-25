/**
 
 * IMPORTANT — PASSWORD HANDLING:
 *   Passwords listed here are PLAIN-TEXT only for seed definition purposes.
 *   db/seed.js hashes every password with bcrypt (10 rounds) before inserting.
 *   Plain-text passwords are NEVER written to MongoDB.
 *

 *
 * Seeded accounts (for login / testing):
 *   john@example.com   → 123456    (user)
 *   admin@example.com  → admin123  (admin)
 *   jane@example.com   → jane1234  (user)
 *   bob@example.com    → bob5678   (user)
 *   sara@example.com   → sara9999  (user)
 *   mike@example.com   → mike2222  (user)
 *   lisa@example.com   → lisa3333  (user)
 */

const SEED_USERS = [

  // ── User 1: Regular user — original assignment seed ───────────────────────
  {
    // UserCredentials fields
    email:    "john@example.com",
    password: "123456",           // hashed by db/seed.js before DB insert
    role:     "user",

    // UserProfile fields
    fullName:    "John Doe",
    phone:       "+1 (555) 101-0001",
    preferences: {
      notifications: true,
      language:      "en",
    },
  },

  // ── User 2: Admin — original assignment seed ──────────────────────────────
  {
    email:    "admin@example.com",
    password: "admin123",
    role:     "admin",

    fullName:    "Admin User",
    phone:       "+1 (555) 000-0000",
    preferences: {
      notifications: true,
      language:      "en",
      adminPanel:    true,
    },
  },

  // ── User 3: Additional regular user ───────────────────────────────────────
  {
    email:    "jane@example.com",
    password: "jane1234",
    role:     "user",

    fullName:    "Jane Smith",
    phone:       "+1 (555) 202-0002",
    preferences: {
      notifications: true,
      language:      "en",
    },
  },

  // ── User 4: Additional regular user ───────────────────────────────────────
  {
    email:    "bob@example.com",
    password: "bob5678",
    role:     "user",

    fullName:    "Bob Johnson",
    phone:       "+1 (555) 303-0003",
    preferences: {
      notifications: false,
      language:      "en",
    },
  },

  // ── User 5: Additional regular user ───────────────────────────────────────
  {
    email:    "sara@example.com",
    password: "sara9999",
    role:     "user",

    fullName:    "Sara Williams",
    phone:       "+1 (555) 404-0004",
    preferences: {
      notifications: true,
      language:      "en",
    },
  },

  // ── User 6: Additional regular user ───────────────────────────────────────
  {
    email:    "mike@example.com",
    password: "mike2222",
    role:     "user",

    fullName:    "Mike Davis",
    phone:       "+1 (555) 505-0005",
    preferences: {
      notifications: true,
      language:      "en",
    },
  },

  // ── User 7: Additional regular user ───────────────────────────────────────
  {
    email:    "lisa@example.com",
    password: "lisa3333",
    role:     "user",

    fullName:    "Lisa Chen",
    phone:       "+1 (555) 606-0006",
    preferences: {
      notifications: true,
      language:      "en",
    },
  },

];

module.exports = SEED_USERS;
