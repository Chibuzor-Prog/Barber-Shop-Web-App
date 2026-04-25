
const express = require('express');
const router  = express.Router();
const Service = require('../models/Service');
const { isNonEmptyString, isPositiveNumber, isValidPriority, isValidName } = require('../utils/validators');

// Helper: shape a Service document into the API response object
function shapeService(s) {
  return {
    id:               s._id,
    name:             s.name,
    description:      s.description,
    expectedDuration: s.expectedDuration ?? s.duration,   // renamed from duration
    priorityLevel:    s.priorityLevel ?? s.priority,      // renamed from priority
  };
}

// ── GET /services ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ createdAt: 1 });
    res.json(services.map(shapeService));
  } catch (err) {
    console.error('GET /services error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /services/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(shapeService(service));
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Service not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /services ────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    // Accept both new names and legacy names for backwards compatibility
    const {
      name,
      description,
      expectedDuration, duration,           // renamed; fallback to duration
      priorityLevel,    priority,            // renamed; fallback to priority
    } = req.body;

    const resolvedDuration  = expectedDuration  ?? duration;
    const resolvedPriority  = priorityLevel     ?? priority;

    if (!name || !isNonEmptyString(name))
      return res.status(400).json({ message: 'Service name is required' });
    if (!isValidName(name, 100))
      return res.status(400).json({ message: 'Service name must be 100 characters or fewer' });
    if (!description || !isNonEmptyString(description))
      return res.status(400).json({ message: 'Description is required' });
    if (!isPositiveNumber(resolvedDuration))
      return res.status(400).json({ message: 'expectedDuration must be a positive number' });
    if (!isValidPriority(resolvedPriority))
      return res.status(400).json({ message: 'priorityLevel must be low, medium, or high' });

    const service = await Service.create({
      name:             name.trim(),
      description:      description.trim(),
      expectedDuration: resolvedDuration,
      priorityLevel:    resolvedPriority,
    });

    res.status(201).json({ message: 'Service created', service: shapeService(service) });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors)[0].message });
    }
    console.error('POST /services error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /services/:id ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || !service.isActive) return res.status(404).json({ message: 'Service not found' });

    const {
      name,
      description,
      expectedDuration, duration,     // accept both new and legacy
      priorityLevel,    priority,
    } = req.body;

    const resolvedDuration = expectedDuration ?? duration;
    const resolvedPriority = priorityLevel    ?? priority;

    if (name !== undefined) {
      if (!isNonEmptyString(name))  return res.status(400).json({ message: 'Name must be a non-empty string' });
      if (!isValidName(name, 100))  return res.status(400).json({ message: 'Name must be 100 characters or fewer' });
      service.name = name.trim();
    }
    if (description !== undefined) {
      if (!isNonEmptyString(description)) return res.status(400).json({ message: 'Description must be a non-empty string' });
      service.description = description.trim();
    }
    if (resolvedDuration !== undefined) {
      if (!isPositiveNumber(resolvedDuration)) return res.status(400).json({ message: 'expectedDuration must be a positive number' });
      service.expectedDuration = resolvedDuration;
    }
    if (resolvedPriority !== undefined) {
      if (!isValidPriority(resolvedPriority)) return res.status(400).json({ message: 'priorityLevel must be low, medium, or high' });
      service.priorityLevel = resolvedPriority;
    }

    await service.save();
    res.json({ message: 'Service updated', service: shapeService(service) });
  } catch (err) {
    if (err.name === 'CastError')      return res.status(404).json({ message: 'Service not found' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors)[0].message });
    console.error('PUT /services/:id error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /services/:id (soft-delete) ────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service || !service.isActive) return res.status(404).json({ message: 'Service not found' });
    service.isActive = false;
    await service.save();
    res.json({ message: 'Service deleted', service: { id: service._id, name: service.name } });
  } catch (err) {
    if (err.name === 'CastError') return res.status(404).json({ message: 'Service not found' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;