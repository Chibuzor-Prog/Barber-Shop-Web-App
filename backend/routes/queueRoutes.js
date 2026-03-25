const express = require('express');
const router = express.Router();
const queue = require('../data/queue');

router.post('/join', (req, res) => {
  const { userId, name, service } = req.body;

  if (!userId || !name || !service) {
    return res.status(400).json({ message: 'userId, name, and service are required' });
  }

  const existingUser = queue.find(person => person.userId === userId);

  if (existingUser) {
    return res.status(400).json({ message: 'User is already in the queue' });
  }

  const newEntry = {
    id: queue.length + 1,
    userId,
    name,
    service,
    joinedAt: new Date()
  };

  queue.push(newEntry);

  res.status(201).json({
    message: 'User joined the queue',
    queue
  });
});

router.post('/leave', (req, res) => {
  const { userId } = req.body;

  const index = queue.findIndex(person => person.userId === userId);

  if (index === -1) {
    return res.status(404).json({ message: 'User not found in queue' });
  }

  const removedUser = queue.splice(index, 1);

  res.json({
    message: 'User left the queue',
    removedUser
  });
});

router.get('/', (req, res) => {
  res.json(queue);
});

router.post('/serve-next', (req, res) => {
  if (queue.length === 0) {
    return res.status(400).json({ message: 'Queue is empty' });
  }

  const nextUser = queue.shift();

  res.json({
    message: 'Next user served',
    nextUser,
    queue
  });
});

module.exports = router;
