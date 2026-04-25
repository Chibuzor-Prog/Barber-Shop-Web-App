
// Establishes and exports the Mongoose connection.



const mongoose = require('mongoose');

let _connected = false;

/**
 * Connect to MongoDB.
 * @param {string} [uri] – Override URI (used by tests with MongoMemoryServer)
 */
async function connectDB(uri) {
  if (_connected) return;

  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/queuesmart';

  try {
    await mongoose.connect(mongoUri, {
      // Mongoose 8+ no longer needs useNewUrlParser / useUnifiedTopology
    });
    _connected = true;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`MongoDB connected: ${mongoUri}`);
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB (used by tests for clean teardown).
 */
async function disconnectDB() {
  if (!_connected) return;
  await mongoose.disconnect();
  _connected = false;
}

/**
 * Drop all collections — used only in tests to reset state between suites.
 */
async function dropAllCollections() {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(col => col.deleteMany({}))
  );
}

module.exports = { connectDB, disconnectDB, dropAllCollections };
