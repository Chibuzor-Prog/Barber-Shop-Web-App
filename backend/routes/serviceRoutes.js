// backend/routes/serviceRoutes.js
const express    = require('express');
const router     = express.Router();
const Service = require('../models/service');

// GET /services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching services', error: err.message });
  }
});

// GET /services/:id
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching service', error: err.message });
  }
});

// POST /services  (admin – create)
router.post('/', async (req, res) => {
  try {
    const { serviceId, name, description, expectedDuration, priorityLevel } = req.body;
    const newService = new Service({ serviceId, name, description, expectedDuration, priorityLevel });
    await newService.save();
    res.status(201).json({ message: 'Service created', service: newService });
  } catch (err) {
    console.error('Error creating service:', err); // Added error logging
    res.status(400).json({ message: 'Error creating service', error: err.message });
  }
});

// PUT /services/:id  (admin – update)
router.put('/:id', async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedService) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service updated', service: updatedService });
  } catch (err) {
    res.status(400).json({ message: 'Error updating service', error: err.message });
  }
});

// DELETE /services/:id  (admin – delete)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Service.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Service not found' });
    res.json({ message: 'Service deleted', service: deleted });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting service', error: err.message });
  }
});

module.exports = router;