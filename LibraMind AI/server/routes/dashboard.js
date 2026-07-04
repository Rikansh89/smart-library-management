const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/student', authenticate, authorize('student'), dashboardController.getStudentDashboard);
router.get('/librarian', authenticate, authorize('librarian', 'admin'), dashboardController.getLibrarianDashboard);
router.get('/admin', authenticate, authorize('admin'), dashboardController.getAdminDashboard);

module.exports = router;
