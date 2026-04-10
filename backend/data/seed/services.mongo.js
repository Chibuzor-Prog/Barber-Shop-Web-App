/**
 * backend/data/seed/services.mongo.js
 *
 * Node.js seed data for the Services collection.
 * Imported by db/seed.js which runs automatically on server start.
 *
 * Field names match the Mongoose Service schema exactly:
 *   expectedDuration  (was: duration)
 *   priorityLevel     (was: priority)
 */

const SEED_SERVICES = [

  // ── Document 1 — original assignment seed ────────────────────────────────
  {
    name:             "Haircut (Men)",
    description:      "Standard haircut for men — includes wash, cut, and blow-dry.",
    expectedDuration: 30,          // renamed from duration
    priorityLevel:    "medium",   // renamed from priority
    isActive:         true,
  },

  // ── Document 2 — original assignment seed ────────────────────────────────
  {
    name:             "Haircut & Beard",
    description:      "Full haircut combined with beard trim and shape-up.",
    expectedDuration: 45,
    priorityLevel:    "high",
    isActive:         true,
  },

  // ── Document 3 — original assignment seed ────────────────────────────────
  {
    name:             "Shampoo",
    description:      "Professional hair wash with premium shampoo and conditioner treatment.",
    expectedDuration: 20,
    priorityLevel:    "low",
    isActive:         true,
  },

  // ── Document 4 — original assignment seed ────────────────────────────────
  {
    name:             "Haircut (Women)",
    description:      "Women's haircut — includes consultation, wash, cut, and style.",
    expectedDuration: 40,
    priorityLevel:    "medium",
    isActive:         true,
  },

  // ── Document 5 — additional service ──────────────────────────────────────
  {
    name:             "Hot Towel Shave",
    description:      "Luxury straight-razor shave with hot towel preparation and aftershave balm.",
    expectedDuration: 35,
    priorityLevel:    "high",
    isActive:         true,
  },

  // ── Document 6 — additional service ──────────────────────────────────────
  {
    name:             "Kids Haircut",
    description:      "Gentle haircut service for children under 12 years old.",
    expectedDuration: 25,
    priorityLevel:    "medium",
    isActive:         true,
  },

];

module.exports = SEED_SERVICES;
