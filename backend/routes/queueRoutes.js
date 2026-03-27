// backend/routes/queueRoutes.js
const express = require('express');
const router  = express.Router();
const store   = require('../data/store');
const { isNonEmptyString, isValidName } = require('../utils/validators');

// ── helpers ──────────────────────────────────────────────────────────────────

function estimateWaitTime(entry) {
  const service = store.services.find(s => s.id === entry.serviceId);
  if (!service) return 0;
  // Only count entries that are still waiting or almost ready (not yet served)
  const serviceQueue = store.queue
    .filter(q => q.serviceId === entry.serviceId && q.status !== 'served')
    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
  const position = serviceQueue.findIndex(q => q.id === entry.id);
  return (position >= 0 ? position : 0) * service.duration;
}

function pushNotification(userId, message) {
  store.notifications.push({
    id:        store.notifications.length + 1,
    userId,
    message,
    createdAt: new Date(),
  });
}

// ── routes ───────────────────────────────────────────────────────────────────

// GET /queue
router.get('/', (req, res) => {
  res.json(store.queue);
});

// POST /queue/join
router.post('/join', (req, res) => {
  const { userId, name, serviceId } = req.body;

  if (!userId || !name || !serviceId) {
    return res.status(400).json({ message: 'userId, name, and serviceId are required' });
  }
  if (!isNonEmptyString(name) || !isValidName(name, 100)) {
    return res.status(400).json({ message: 'name must be a non-empty string (max 100 chars)' });
  }

  const service = store.services.find(s => s.id === Number(serviceId));
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  const existing = store.queue.find(
    q => String(q.userId) === String(userId) &&
         q.serviceId === Number(serviceId) &&
         q.status !== 'served'
  );
  if (existing) {
    return res.status(400).json({ message: 'User is already in this service queue' });
  }

  // Ticket number: max across ALL queue entries + 1
  const ticketNumber = store.queue.length > 0
    ? Math.max(...store.queue.map(q => q.ticketNumber)) + 1
    : 1;

  const newEntry = {
    id:          Date.now(),
    userId,
    name:        name.trim(),
    serviceId:   Number(serviceId),
    serviceName: service.name,
    status:      'waiting',
    ticketNumber,
    joinedAt:    new Date().toISOString(),
  };

  store.queue.push(newEntry);
  pushNotification(userId, `You joined the queue for ${service.name}. Ticket #${ticketNumber}`);

  res.status(201).json({ message: 'Joined queue', entry: newEntry, queue: store.queue });
});

// POST /queue/leave  (by userId + serviceId)
router.post('/leave', (req, res) => {
  const { userId, serviceId } = req.body;
  if (!userId || !serviceId) {
    return res.status(400).json({ message: 'userId and serviceId are required' });
  }

  const index = store.queue.findIndex(
    q => String(q.userId) === String(userId) &&
         q.serviceId === Number(serviceId) &&
         q.status !== 'served'
  );
  if (index === -1) {
    return res.status(404).json({ message: 'User not found in that service queue' });
  }

  const [removed] = store.queue.splice(index, 1);

  store.history.push({
    id:          store.history.length + 1,
    userId:      removed.userId,
    userName:    removed.name,
    serviceId:   removed.serviceId,
    serviceName: removed.serviceName,
    outcome:     'Cancelled',
    date:        new Date().toISOString().split('T')[0],
  });

  pushNotification(userId, `You left the queue for ${removed.serviceName}`);
  res.json({ message: 'Left queue', removed });
});

// POST /queue/leave-by-id  (cancel by entry id — used by frontend Cancel button)
router.post('/leave-by-id', (req, res) => {
  const { entryId } = req.body;
  if (!entryId) return res.status(400).json({ message: 'entryId is required' });

  const index = store.queue.findIndex(q => q.id === Number(entryId));
  if (index === -1) return res.status(404).json({ message: 'Queue entry not found' });

  const [removed] = store.queue.splice(index, 1);

  store.history.push({
    id:          store.history.length + 1,
    userId:      removed.userId,
    userName:    removed.name,
    serviceId:   removed.serviceId,
    serviceName: removed.serviceName,
    outcome:     'Cancelled',
    date:        new Date().toISOString().split('T')[0],
  });

  pushNotification(removed.userId, `Queue entry cancelled for ${removed.serviceName}`);
  res.json({ message: 'Entry removed', removed });
});

// POST /queue/serve-next
router.post('/serve-next', (req, res) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ message: 'serviceId is required' });

  // Only serve users with status === 'waiting' (skip 'almost ready')
  const index = store.queue.findIndex(
    q => q.serviceId === Number(serviceId) && q.status === 'waiting'
  );
  if (index === -1) {
    return res.status(400).json({ message: 'No waiting users for this service' });
  }

  store.queue[index].status = 'served';
  const served = store.queue[index];

  store.history.push({
    id:          store.history.length + 1,
    userId:      served.userId,
    userName:    served.name,
    serviceId:   served.serviceId,
    serviceName: served.serviceName,
    outcome:     'Served',
    date:        new Date().toISOString().split('T')[0],
  });

  pushNotification(
    served.userId,
    `You have been served for ${served.serviceName}! Ticket #${served.ticketNumber}`
  );

  // Promote the NEXT waiting person (not almost-ready) to 'almost ready'
  const nextWaiting = store.queue.find(
    q => q.serviceId === Number(serviceId) && q.status === 'waiting'
  );
  if (nextWaiting) {
    nextWaiting.status = 'almost ready';
    pushNotification(
      nextWaiting.userId,
      `You're almost ready! Ticket #${nextWaiting.ticketNumber} for ${nextWaiting.serviceName}`
    );
  }

  res.json({ message: 'User served', served, queue: store.queue });
});

// POST /queue/remove  (admin force-remove)
router.post('/remove', (req, res) => {
  const { entryId } = req.body;
  if (!entryId) return res.status(400).json({ message: 'entryId is required' });

  const index = store.queue.findIndex(q => q.id === Number(entryId));
  if (index === -1) return res.status(404).json({ message: 'Queue entry not found' });

  const [removed] = store.queue.splice(index, 1);
  pushNotification(removed.userId, `You were removed from the queue for ${removed.serviceName}`);
  res.json({ message: 'User removed from queue', removed });
});

// POST /queue/reset
router.post('/reset', (req, res) => {
  store.queue.length = 0;
  res.json({ message: 'Queue reset' });
});

// GET /queue/wait-time/:entryId
router.get('/wait-time/:entryId', (req, res) => {
  const entry = store.queue.find(q => q.id === Number(req.params.entryId));
  if (!entry) return res.status(404).json({ message: 'Queue entry not found' });
  res.json({ entryId: entry.id, estimatedWaitMinutes: estimateWaitTime(entry) });
});

// GET /queue/user/:userId
router.get('/user/:userId', (req, res) => {
  const userQueue = store.queue.filter(
    q => String(q.userId) === String(req.params.userId)
  );
  const enriched = userQueue.map(entry => ({
    ...entry,
    estimatedWaitMinutes: estimateWaitTime(entry),
  }));
  res.json(enriched);
});

module.exports = router;