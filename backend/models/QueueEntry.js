// backend/models/QueueEntry.js
// Tracks individual users waiting in a queue (one document per join).

const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    queueId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Queue',
      required: true,
    },
    serviceId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Service',
      required: true,
    },
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'UserCredentials',
      required: true,
    },
    userName: {
      type:     String,
      required: true,
      trim:     true,
    },
    serviceName: {
      type:     String,
      required: true,
    },
    ticketNumber: {
      type:     Number,
      required: true,
    },
    // Position in queue (recalculated on serve/leave)
    position: {
      type:    Number,
      default: 0,
    },
    joinTime: {
      type:    Date,
      default: Date.now,
    },
    status: {
      type:    String,
      enum:    {
        values:  ['waiting', 'almost ready', 'served', 'cancelled'],
        message: 'Status must be waiting, almost ready, served, or cancelled',
      },
      default: 'waiting',
    },
    // Estimated wait time in minutes (stored for quick retrieval)
    estimatedWaitMinutes: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for fast lookups by service + status
queueEntrySchema.index({ serviceId: 1, status: 1 });
queueEntrySchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
