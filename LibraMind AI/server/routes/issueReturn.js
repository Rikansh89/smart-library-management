const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const issueReturnController = require('../controllers/issueReturnController');

const router = express.Router();

router.get('/', authenticate, issueReturnController.getIssuedBooks);
router.get('/my-issues', authenticate, issueReturnController.getMyIssues);
router.get('/reservations', authenticate, issueReturnController.getReservations);

router.post('/issue', authenticate, authorize('librarian', 'admin'), [
  body('user_id').isInt().withMessage('User ID is required'),
  body('book_id').isInt().withMessage('Book ID is required'),
  validate
], issueReturnController.issueBook);

router.post('/return', authenticate, authorize('librarian', 'admin'), [
  body('issued_book_id').isInt().withMessage('Issue record ID is required'),
  validate
], issueReturnController.returnBook);

router.post('/renew', authenticate, [
  body('issued_book_id').isInt().withMessage('Issue record ID is required'),
  validate
], issueReturnController.renewBook);

router.post('/reservations/:id/cancel', authenticate, issueReturnController.cancelReservation);

module.exports = router;
