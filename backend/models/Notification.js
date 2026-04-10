// backend/models/Notification.js
// Tracks system notifications and queue history activity.
// Serves dual purpose: real-time notifications + historical record.

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'UserCredentials',
      required: true,
    },
    message: {
      type:     String,
      required: [true, 'Message is required'],
      trim:     true,
      maxlength:[500, 'Message must be 500 characters or fewer'],
    },
    type: {
      type:    String,
      enum:    {
        values:  ['joined', 'served', 'cancelled', 'almost_ready', 'removed', 'general'],
        message: 'Invalid notification type',
      },
      default: 'general',
    },
    // Status: sent = new / unread;  viewed = user has seen it
    status: {
      type:    String,
      enum:    { values: ['sent', 'viewed'], message: 'Status must be sent or viewed' },
      default: 'sent',
    },
    // Optional link back to the queue entry this notification relates to
    queueEntryId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'QueueEntry',
      default: null,
    },
    serviceId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'Service',
      default: null,
    },
    serviceName: {
      type:    String,
      default: '',
    },
  },
  { timestamps: true }   // createdAt = timestamp
);

// Fast lookup: all notifications for a user, newest first
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
