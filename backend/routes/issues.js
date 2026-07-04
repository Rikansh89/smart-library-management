const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/request', authenticate, authorize('student'), issueController.requestIssue);
router.put('/:id/approve', authenticate, authorize('librarian', 'admin'), issueController.approveIssue);
router.put('/:id/return', authenticate, authorize('librarian', 'admin'), issueController.returnBook);
router.get('/', authenticate, authorize('librarian', 'admin'), issueController.getAllIssues);
router.get('/my', authenticate, issueController.getUserIssues);
router.get('/scan/:bookId', authenticate, authorize('librarian', 'admin'), issueController.scanIssue);
router.get('/:id', authenticate, issueController.getIssueById);

module.exports = router;
