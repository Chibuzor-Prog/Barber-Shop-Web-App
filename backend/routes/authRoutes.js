// backend/routes/authRoutes.js
const express = require('express');
const router  = express.Router();
const store   = require('../data/store');

// POST /auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const existingUser = store.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const newUser = {
    id:       store.users.length + 1,
    name,
    email,
    password,
    role:     'user',
  };

  store.users.push(newUser);
  res.json({ message: 'User registered', user: newUser });
});

// POST /auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = store.users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful', user });
});

module.exports = router;