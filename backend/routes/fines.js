const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/my', authenticate, fineController.getUserFines);
router.get('/total-unpaid', authenticate, fineController.getTotalUnpaid);
router.put('/:id/pay', authenticate, fineController.payFine);
router.get('/stats', authenticate, authorize('admin'), fineController.getFineStats);

module.exports = router;
