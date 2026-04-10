// backend/models/Service.js
// Stores services offered by the organisation.

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Service name is required'],
      trim:      true,
      maxlength: [100, 'Service name must be 100 characters or fewer'],
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      trim:      true,
      maxlength: [500, 'Description must be 500 characters or fewer'],
    },
    // Expected duration in minutes
    expectedDuration: {
      type:    Number,
      required:[true, 'Expected duration is required'],
      min:     [1, 'Expected duration must be at least 1 minute'],
    },
    priorityLevel: {
      type:    String,
      enum:    { values: ['low', 'medium', 'high'], message: 'Priority level must be low, medium, or high' },
      default: 'medium',
    },
    // Whether the service is still active / offered
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
