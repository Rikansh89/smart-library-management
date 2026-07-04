const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.get('/', authenticate, notificationController.getNotifications);
router.put('/:id/read', authenticate, notificationController.markAsRead);
router.put('/read-all', authenticate, notificationController.markAllAsRead);

router.post('/send-reminders', authenticate, authorize('librarian', 'admin'), notificationController.sendDueDateReminders);
router.post('/send-overdue-alerts', authenticate, authorize('librarian', 'admin'), notificationController.sendOverdueAlerts);

module.exports = router;
