// backend/controllers/reportController.js
const User = require('../models/UserProfile');
const UserCredentials = require('../models/UserCredentials');
const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Service = require('../models/Service');
const History = require('../models/History');

/**
 * Get all users/customers and their queue participation history
 */
async function getUsersHistory(req, res) {
  try {
    // Join UserProfile with UserCredentials for role/email
    const users = await User.find();
    const credentials = await UserCredentials.find();
    const histories = await History.find();
    const userHistories = users.map(user => {
      const cred = credentials.find(c => c._id.toString() === user.credentialId.toString());
      return {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: cred ? cred.role : 'user',
        },
        history: histories.filter(h => h.userId.toString() === user.credentialId.toString())
      };
    });
    res.json(userHistories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get service details and queue activity
 */
async function getServiceActivity(req, res) {
  try {
    const services = await Service.find();
    const queueEntries = await QueueEntry.find();
    const serviceActivity = services.map(service => ({
      service: {
        _id: service._id,
        name: service.name,
        description: service.description,
        expectedDuration: service.expectedDuration,
        priorityLevel: service.priorityLevel,
        isActive: service.isActive,
      },
      queueEntries: queueEntries.filter(qe => qe.serviceId.toString() === service._id.toString())
    }));
    res.json(serviceActivity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get queue usage statistics (number of users served, average wait time)
 */
async function getQueueStats(req, res) {
  try {
    const histories = await History.find();
    // Number of users served
    const usersServed = histories.length;
    // Average wait time (if available)
    const waitTimes = histories.map(h => h.waitTime).filter(wt => typeof wt === 'number');
    const avgWaitTime = waitTimes.length ? (waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
    res.json({ usersServed, avgWaitTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getUsersHistory,
  getServiceActivity,
  getQueueStats,
};
