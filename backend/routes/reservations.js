const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('student'), reservationController.createReservation);
router.get('/my', authenticate, reservationController.getUserReservations);
router.get('/', authenticate, authorize('librarian', 'admin'), reservationController.getAllReservations);
router.put('/:id/approve', authenticate, authorize('librarian', 'admin'), reservationController.approveReservation);
router.put('/:id/cancel', authenticate, reservationController.cancelReservation);

module.exports = router;
