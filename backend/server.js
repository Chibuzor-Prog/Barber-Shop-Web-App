// backend/server.js
require('dotenv').config();

const express            = require('express');
const cors               = require('cors');
const { connectDB }      = require('./db/connection');
const authRoutes         = require('./routes/authRoutes');
const queueRoutes        = require('./routes/queueRoutes');
const serviceRoutes      = require('./routes/serviceRoutes');
const historyRoutes      = require('./routes/historyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes      = require('./routes/profileRoutes');

const app  = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes);
app.use('/queue',         queueRoutes);
app.use('/services',      serviceRoutes);
app.use('/history',       historyRoutes);
app.use('/notifications', notificationRoutes);
app.use('/profile',       profileRoutes);

// ── Test-only reset endpoint ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'test') {
  const { dropAllCollections } = require('./db/connection');
  const seed                   = require('./db/seed');

  app.post('/test/reset', async (req, res) => {
    try {
      await dropAllCollections();
      await seed();
      res.json({ message: 'Store reset' });
    } catch (err) {
      res.status(500).json({ message: 'Reset failed', error: err.message });
    }
  });
}

app.get('/', (req, res) => {
  res.send('QueueSmart Backend is running\n');
});

// ── Start (only when run directly) ───────────────────────────────────────────
if (require.main === module) {
  (async () => {
    await connectDB();

    const seed    = require('./db/seed');
    const Service = require('./models/Service');
    const count   = await Service.countDocuments();
    if (count === 0) {
      console.log('Empty database — running seed...');
      await seed();
    }

    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running at http://127.0.0.1:${PORT}`);
    });

    server.on('error', err => console.error('Server error:', err));

    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      server.close();
      process.exit(0);
    });
  })();
}

module.exports = app;
