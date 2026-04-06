const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  expectedDuration: {
    type: Number, // in minutes
    required: true
  },
  priorityLevel: {
    type: Number, // e.g., 1 = highest
    required: true
  }
});

module.exports = mongoose.model('Service', serviceSchema);
