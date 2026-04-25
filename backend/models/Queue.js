
// Represents an active queue for a service.
// One open queue exists per service at a time.

const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema(
  {
    serviceId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Service',
      required: true,
    },
    status: {
      type:    String,
      enum:    { values: ['open', 'closed'], message: 'Queue status must be open or closed' },
      default: 'open',
    },
    // Incremental ticket counter for this queue
    ticketCounter: {
      type:    Number,
      default: 0,
    },
  },
  { timestamps: true }   // createdAt = queue created date
);

module.exports = mongoose.model('Queue', queueSchema);
