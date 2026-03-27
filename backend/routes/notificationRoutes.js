// backend/routes/notificationRoutes.js
const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

// GET /notifications/user/:userId
router.get('/user/:userId', (req, res) => {
  const userNotifs = store.notifications.filter(
    n => String(n.userId) === String(req.params.userId)
  );
  res.json(userNotifs);
});

// DELETE /notifications/:id
router.delete('/:id', (req, res) => {
  const index = store.notifications.findIndex(n => n.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Notification not found' });
  const [removed] = store.notifications.splice(index, 1);
  res.json({ message: 'Notification removed', removed });
});

module.exports = router;