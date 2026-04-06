// backend/server.js

const express           = require('express');
const cors              = require('cors');
const mongoose          = require('mongoose');
const authRoutes        = require('./routes/authRoutes');
const queueRoutes       = require('./routes/queueRoutes');
const serviceRoutes     = require('./routes/serviceRoutes');
const historyRoutes     = require('./routes/historyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const store             = require('./data/store');

// ── MongoDB Connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/queuesmart';
mongoose.connect(MONGO_URI);
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const app  = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes);
app.use('/queue',         queueRoutes);
app.use('/services',      serviceRoutes);
app.use('/history',       historyRoutes);
app.use('/notifications', notificationRoutes);

// ── Test-only reset endpoint ──────────────────────────────────────────────────
// POST /test/reset  — resets all in-memory state to seed data.
// Only active when NODE_ENV !== 'production'.
if (process.env.NODE_ENV !== 'production') {
  app.post('/test/reset', (req, res) => {
    store.reset();
    res.json({ message: 'Store reset' });
  });
}

app.get('/', (req, res) => {
  res.send('QueueSmart Backend is running\n');
});

// ── Start server (only when run directly, not when required by tests) ─────────
if (require.main === module) {
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
  });

  server.on('error', (err) => { console.error('Server error:', err); });

  process.on('SIGINT', () => {
    console.log('Stopped with Ctrl+C');
    process.exit(0);
  });
}

module.exports = app;