// backend/data/store.js
// Single source of truth for all in-memory data.
// Using a store object (not bare exported arrays) means route modules always
// read/write the SAME reference — clearing the store resets all data without
// needing require-cache tricks.

let _idCounter = 1;
function nextId() { return _idCounter++; }

const SEED_SERVICES = [
  { id: 1, name: 'Haircut (Men)',   description: 'Standard haircut',       duration: 30, priority: 'medium' },
  { id: 2, name: 'Haircut & Beard', description: 'Haircut and beard trim', duration: 45, priority: 'high'   },
  { id: 3, name: 'Shampoo',         description: 'Hair wash and shampoo',  duration: 20, priority: 'low'    },
  { id: 4, name: 'Haircut (Women)', description: "Women's haircut",        duration: 40, priority: 'medium' },
];

const SEED_USERS = [
  { id: 1, name: 'John Doe',    email: 'john@example.com',  password: '123456',   role: 'user'  },
  { id: 2, name: 'Admin User',  email: 'admin@example.com', password: 'admin123', role: 'admin' },
];

const store = {
  users:         [],
  services:      [],
  queue:         [],
  history:       [],
  notifications: [],

  /** Called once at startup and in tests before each test. */
  reset() {
    _idCounter = 1;
    this.users         = SEED_USERS.map(u => ({ ...u }));
    this.services      = SEED_SERVICES.map(s => ({ ...s }));
    this.queue         = [];
    this.history       = [];
    this.notifications = [];
  },

  nextId,
};

// Initialise on first require
store.reset();

module.exports = store;