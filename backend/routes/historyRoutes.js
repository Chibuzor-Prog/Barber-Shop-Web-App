// backend/routes/historyRoutes.js
const express = require('express');
const router  = express.Router();
const History = require('../models/History');

// ── GET /history  (admin – all records) ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const records = await History.find({}).sort({ createdAt: -1 });
    res.json(records.map(h => ({
      id:          h._id,
      userId:      h.userId,
      userName:    h.userName,
      serviceId:   h.serviceId,
      serviceName: h.serviceName,
      ticketNumber:h.ticketNumber,
      outcome:     h.outcome,
      date:        h.date,
      joinedAt:    h.joinedAt,
      completedAt: h.completedAt,
    })));
  } catch (err) {
    console.error('GET /history error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /history/user/:userId  (user's own history) ───────────────────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const records = await History.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(records.map(h => ({
      id:          h._id,
      userId:      h.userId,
      userName:    h.userName,
      serviceId:   h.serviceId,
      serviceName: h.serviceName,
      ticketNumber:h.ticketNumber,
      outcome:     h.outcome,
      date:        h.date,
      joinedAt:    h.joinedAt,
      completedAt: h.completedAt,
    })));
  } catch (err) {
    if (err.name === 'CastError') return res.json([]);
    console.error('GET /history/user/:userId error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
