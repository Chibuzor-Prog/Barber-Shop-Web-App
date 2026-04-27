// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();


const authenticateJWT = require('../middleware/authenticateJWT');
const ensureAdmin = require('../middleware/ensureAdmin');
const reportController = require('../controllers/reportController');


// 1. List of users/customers and their queue participation history
router.get('/users-history', authenticateJWT, ensureAdmin, reportController.getUsersHistory);

// 2. Service details and queue activity
router.get('/service-activity', authenticateJWT, ensureAdmin, reportController.getServiceActivity);

// 3. Queue usage statistics
router.get('/queue-stats', authenticateJWT, ensureAdmin, reportController.getQueueStats);

module.exports = router;
