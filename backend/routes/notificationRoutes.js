// backend/routes/notificationRoutes.js
const express      = require('express');
const router       = express.Router();
const Notification = require('../models/Notification');

// ── GET /notifications/user/:userId ───────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifs.map(n => ({
      id:          n._id,
      userId:      n.userId,
      message:     n.message,
      type:        n.type,
      status:      n.status,
      serviceName: n.serviceName,
      createdAt:   n.createdAt,
    })));
  } catch (err) {
    if (err.name === 'CastError') return res.json([]);
    console.error('GET /notifications/user/:userId error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /notifications/:id/viewed  (mark as viewed) ─────────────────────────
router.patch('/:id/viewed', async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    notif.status = 'viewed';
    await notif.save();
    res.json({ message: 'Notification marked as viewed', id: notif._id });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Notification not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /notifications/:id  (dismiss / delete) ─────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification removed', removed: { id: notif._id } });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Notification not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
