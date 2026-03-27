// backend/routes/historyRoutes.js
const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

// GET /history  (admin – all)
router.get('/', (req, res) => {
  res.json(store.history);
});

// GET /history/user/:userId
router.get('/user/:userId', (req, res) => {
  const userHistory = store.history.filter(
    h => String(h.userId) === String(req.params.userId)
  );
  res.json(userHistory);
});

module.exports = router;