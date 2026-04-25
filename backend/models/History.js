
// Tracks completed queue participation records for users.
// Written when a user is served or cancels — never mutated after creation.

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'UserCredentials',
      required: true,
    },
    userName: {
      type:     String,
      required: true,
    },
    serviceId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Service',
      default: null,
    },
    serviceName: {
      type:     String,
      required: true,
    },
    ticketNumber: {
      type:    Number,
      default: null,
    },
    outcome: {
      type:    String,
      enum:    { values: ['Served', 'Cancelled'], message: 'Outcome must be Served or Cancelled' },
      required:true,
    },
    // ISO date string (YYYY-MM-DD) for quick display
    date: {
      type:    String,
      required:true,
    },
    // Actual join and completion timestamps
    joinedAt: {
      type:    Date,
      default: null,
    },
    completedAt: {
      type:    Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

historySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('History', historySchema);
