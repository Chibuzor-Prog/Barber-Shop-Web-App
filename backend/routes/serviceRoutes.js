// backend/routes/serviceRoutes.js
const express    = require('express');
const router     = express.Router();
const store      = require('../data/store');
const { isNonEmptyString, isPositiveNumber, isValidPriority, isValidName } = require('../utils/validators');

// GET /services
router.get('/', (req, res) => {
  res.json(store.services);
});

// GET /services/:id
router.get('/:id', (req, res) => {
  const service = store.services.find(s => s.id === Number(req.params.id));
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
});

// POST /services  (admin – create)
router.post('/', (req, res) => {
  const { name, description, duration, priority } = req.body;

  if (!name || !isNonEmptyString(name))
    return res.status(400).json({ message: 'Service name is required' });
  if (!isValidName(name, 100))
    return res.status(400).json({ message: 'Service name must be 100 characters or fewer' });
  if (!description || !isNonEmptyString(description))
    return res.status(400).json({ message: 'Description is required' });
  if (!isPositiveNumber(duration))
    return res.status(400).json({ message: 'Duration must be a positive number' });
  if (!isValidPriority(priority))
    return res.status(400).json({ message: 'Priority must be low, medium, or high' });

  const newService = {
    id:          store.services.length > 0
                   ? Math.max(...store.services.map(s => s.id)) + 1
                   : 1,
    name:        name.trim(),
    description: description.trim(),
    duration,
    priority,
  };
  store.services.push(newService);
  res.status(201).json({ message: 'Service created', service: newService });
});

// PUT /services/:id  (admin – update)
router.put('/:id', (req, res) => {
  const index = store.services.findIndex(s => s.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Service not found' });

  const { name, description, duration, priority } = req.body;

  if (name !== undefined) {
    if (!isNonEmptyString(name))
      return res.status(400).json({ message: 'Name must be a non-empty string' });
    if (!isValidName(name, 100))
      return res.status(400).json({ message: 'Name must be 100 characters or fewer' });
    store.services[index].name = name.trim();
  }
  if (description !== undefined) {
    if (!isNonEmptyString(description))
      return res.status(400).json({ message: 'Description must be a non-empty string' });
    store.services[index].description = description.trim();
  }
  if (duration !== undefined) {
    if (!isPositiveNumber(duration))
      return res.status(400).json({ message: 'Duration must be a positive number' });
    store.services[index].duration = duration;
  }
  if (priority !== undefined) {
    if (!isValidPriority(priority))
      return res.status(400).json({ message: 'Priority must be low, medium, or high' });
    store.services[index].priority = priority;
  }

  res.json({ message: 'Service updated', service: store.services[index] });
});

// DELETE /services/:id  (admin – delete)
router.delete('/:id', (req, res) => {
  const index = store.services.findIndex(s => s.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Service not found' });
  const [deleted] = store.services.splice(index, 1);
  res.json({ message: 'Service deleted', service: deleted });
});

module.exports = router;