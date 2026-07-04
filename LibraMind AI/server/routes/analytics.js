const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.get('/popular-books', authenticate, authorize('librarian', 'admin'), analyticsController.getMostPopularBooks);
router.get('/monthly-trends', authenticate, authorize('librarian', 'admin'), analyticsController.getMonthlyTrends);
router.get('/category-usage', authenticate, authorize('librarian', 'admin'), analyticsController.getCategoryUsage);
router.get('/student-activity', authenticate, authorize('admin'), analyticsController.getStudentActivity);
router.get('/fine-reports', authenticate, authorize('admin'), analyticsController.getFineReports);

module.exports = router;
