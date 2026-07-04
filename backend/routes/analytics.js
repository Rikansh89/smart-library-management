const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('admin'), analyticsController.getDashboardStats);
router.get('/full', authenticate, authorize('admin'), analyticsController.getAnalytics);

module.exports = router;
