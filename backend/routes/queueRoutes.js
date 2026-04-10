// backend/routes/queueRoutes.js
const express      = require('express');
const router       = express.Router();
const mongoose     = require('mongoose');
const Queue        = require('../models/Queue');
const QueueEntry   = require('../models/QueueEntry');
const Service      = require('../models/Service');
const History      = require('../models/History');
const Notification = require('../models/Notification');
const { isNonEmptyString, isValidName } = require('../utils/validators');

// ── helpers ───────────────────────────────────────────────────────────────────

/** Get or create the open queue for a service. */
async function getOrCreateQueue(serviceId) {
  let queue = await Queue.findOne({ serviceId, status: 'open' });
  if (!queue) {
    queue = await Queue.create({ serviceId, status: 'open', ticketCounter: 0 });
  }
  return queue;
}

/** Calculate estimated wait time for an entry (position × expectedDuration). */
async function calcWaitTime(entry) {
  const service = await Service.findById(entry.serviceId);
  if (!service) return 0;

  const aheadCount = await QueueEntry.countDocuments({
    queueId:  entry.queueId,
    status:   'waiting',
    joinTime: { $lt: entry.joinTime },
  });
  return aheadCount * service.expectedDuration;
}

/** Push a notification to the DB. */
async function pushNotification(userId, message, type = 'general', extras = {}) {
  return Notification.create({ userId, message, type, status: 'sent', ...extras });
}

/** Shape a QueueEntry document into the API response format. */
function shapeEntry(e) {
  return {
    id:                   e._id,
    userId:               e.userId,
    name:                 e.userName,
    serviceId:            e.serviceId,
    serviceName:          e.serviceName,
    status:               e.status,
    ticketNumber:         e.ticketNumber,
    joinedAt:             e.joinTime,
    estimatedWaitMinutes: e.estimatedWaitMinutes,
  };
}

// ── GET /queue ─────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const entries = await QueueEntry.find({ status: { $in: ['waiting', 'almost ready', 'served'] } })
      .sort({ joinTime: 1 });
    res.json(entries.map(shapeEntry));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /queue/join ───────────────────────────────────────────────────────────
router.post('/join', async (req, res) => {
  try {
    const { userId, name, serviceId } = req.body;

    if (!userId || !name || !serviceId) {
      return res.status(400).json({ message: 'userId, name, and serviceId are required' });
    }
    if (!isNonEmptyString(name) || !isValidName(name, 100)) {
      return res.status(400).json({ message: 'name must be a non-empty string (max 100 chars)' });
    }

    // Validate service exists
    const service = await Service.findById(serviceId).catch(() => null);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check user not already waiting for this service
    const existingEntry = await QueueEntry.findOne({
      userId,
      serviceId,
      status: { $in: ['waiting', 'almost ready'] },
    });
    if (existingEntry) {
      return res.status(400).json({ message: 'User is already in this service queue' });
    }

    // Get or create the open queue for this service
    const queue = await getOrCreateQueue(service._id);

    // Increment ticket counter
    queue.ticketCounter += 1;
    await queue.save();

    const entry = await QueueEntry.create({
      queueId:      queue._id,
      serviceId:    service._id,
      userId,
      userName:     name.trim(),
      serviceName:  service.name,
      ticketNumber: queue.ticketCounter,
      joinTime:     new Date(),
      status:       'waiting',
    });

    // Calculate and store wait time
    entry.estimatedWaitMinutes = await calcWaitTime(entry);
    await entry.save();

    await pushNotification(
      userId,
      `You joined the queue for ${service.name}. Ticket #${entry.ticketNumber}`,
      'joined',
      { queueEntryId: entry._id, serviceId: service._id, serviceName: service.name }
    );

    res.status(201).json({ message: 'Joined queue', entry: shapeEntry(entry) });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Service not found' });
    console.error('POST /queue/join error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /queue/leave (by userId + serviceId) ──────────────────────────────────
router.post('/leave', async (req, res) => {
  try {
    const { userId, serviceId } = req.body;
    if (!userId || !serviceId) {
      return res.status(400).json({ message: 'userId and serviceId are required' });
    }

    const entry = await QueueEntry.findOne({
      userId,
      serviceId,
      status: { $in: ['waiting', 'almost ready'] },
    });
    if (!entry) return res.status(404).json({ message: 'User not found in that service queue' });

    entry.status = 'cancelled';
    await entry.save();

    await History.create({
      userId,
      userName:     entry.userName,
      serviceId:    entry.serviceId,
      serviceName:  entry.serviceName,
      ticketNumber: entry.ticketNumber,
      outcome:      'Cancelled',
      date:         new Date().toISOString().split('T')[0],
      joinedAt:     entry.joinTime,
      completedAt:  new Date(),
    });

    await pushNotification(
      userId,
      `You left the queue for ${entry.serviceName}`,
      'cancelled',
      { queueEntryId: entry._id, serviceId: entry.serviceId, serviceName: entry.serviceName }
    );

    res.json({ message: 'Left queue', removed: shapeEntry(entry) });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'User not found in that service queue' });
    console.error('POST /queue/leave error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /queue/leave-by-id ────────────────────────────────────────────────────
router.post('/leave-by-id', async (req, res) => {
  try {
    const { entryId } = req.body;
    if (!entryId) return res.status(400).json({ message: 'entryId is required' });

    const entry = await QueueEntry.findById(entryId);
    if (!entry) return res.status(404).json({ message: 'Queue entry not found' });

    entry.status = 'cancelled';
    await entry.save();

    await History.create({
      userId:       entry.userId,
      userName:     entry.userName,
      serviceId:    entry.serviceId,
      serviceName:  entry.serviceName,
      ticketNumber: entry.ticketNumber,
      outcome:      'Cancelled',
      date:         new Date().toISOString().split('T')[0],
      joinedAt:     entry.joinTime,
      completedAt:  new Date(),
    });

    await pushNotification(
      entry.userId,
      `Queue entry cancelled for ${entry.serviceName}`,
      'cancelled',
      { queueEntryId: entry._id, serviceId: entry.serviceId, serviceName: entry.serviceName }
    );

    res.json({ message: 'Entry removed', removed: shapeEntry(entry) });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Queue entry not found' });
    console.error('POST /queue/leave-by-id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /queue/serve-next ─────────────────────────────────────────────────────
router.post('/serve-next', async (req, res) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) return res.status(400).json({ message: 'serviceId is required' });

    // Find the earliest waiting entry (not almost-ready)
    const entry = await QueueEntry.findOne({
      serviceId,
      status: 'waiting',
    }).sort({ joinTime: 1 });

    if (!entry) return res.status(400).json({ message: 'No waiting users for this service' });

    entry.status = 'served';
    await entry.save();

    await History.create({
      userId:       entry.userId,
      userName:     entry.userName,
      serviceId:    entry.serviceId,
      serviceName:  entry.serviceName,
      ticketNumber: entry.ticketNumber,
      outcome:      'Served',
      date:         new Date().toISOString().split('T')[0],
      joinedAt:     entry.joinTime,
      completedAt:  new Date(),
    });

    await pushNotification(
      entry.userId,
      `You have been served for ${entry.serviceName}! Ticket #${entry.ticketNumber}`,
      'served',
      { queueEntryId: entry._id, serviceId: entry.serviceId, serviceName: entry.serviceName }
    );

    // Promote next waiting person to 'almost ready'
    const nextEntry = await QueueEntry.findOne({
      serviceId,
      status: 'waiting',
    }).sort({ joinTime: 1 });

    if (nextEntry) {
      nextEntry.status = 'almost ready';
      nextEntry.estimatedWaitMinutes = 0;
      await nextEntry.save();

      await pushNotification(
        nextEntry.userId,
        `You're almost ready! Ticket #${nextEntry.ticketNumber} for ${nextEntry.serviceName}`,
        'almost_ready',
        { queueEntryId: nextEntry._id, serviceId: nextEntry.serviceId, serviceName: nextEntry.serviceName }
      );
    }

    res.json({ message: 'User served', served: shapeEntry(entry) });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid serviceId' });
    console.error('POST /queue/serve-next error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /queue/remove (admin force-remove) ────────────────────────────────────
router.post('/remove', async (req, res) => {
  try {
    const { entryId } = req.body;
    if (!entryId) return res.status(400).json({ message: 'entryId is required' });

    const entry = await QueueEntry.findById(entryId);
    if (!entry) return res.status(404).json({ message: 'Queue entry not found' });

    entry.status = 'cancelled';
    await entry.save();

    await pushNotification(
      entry.userId,
      `You were removed from the queue for ${entry.serviceName}`,
      'removed',
      { queueEntryId: entry._id, serviceId: entry.serviceId, serviceName: entry.serviceName }
    );

    res.json({ message: 'User removed from queue', removed: shapeEntry(entry) });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Queue entry not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /queue/reset ──────────────────────────────────────────────────────────
router.post('/reset', async (req, res) => {
  try {
    await QueueEntry.updateMany(
      { status: { $in: ['waiting', 'almost ready'] } },
      { $set: { status: 'cancelled' } }
    );
    res.json({ message: 'Queue reset' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /queue/wait-time/:entryId ──────────────────────────────────────────────
router.get('/wait-time/:entryId', async (req, res) => {
  try {
    const entry = await QueueEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Queue entry not found' });

    const estimatedWaitMinutes = await calcWaitTime(entry);
    res.json({ entryId: entry._id, estimatedWaitMinutes });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Queue entry not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /queue/user/:userId ────────────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const entries = await QueueEntry.find({
      userId: req.params.userId,
      status: { $in: ['waiting', 'almost ready', 'served'] },
    }).sort({ joinTime: 1 });

    const enriched = await Promise.all(
      entries.map(async e => ({
        ...shapeEntry(e),
        estimatedWaitMinutes: await calcWaitTime(e),
      }))
    );
    res.json(enriched);
  } catch (err) {
    if (err.name === 'CastError') return res.json([]);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
