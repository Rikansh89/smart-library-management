const express = require('express');
const router = express.Router();
const studyRoomController = require('../controllers/studyRoomController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', studyRoomController.getAllRooms);
router.get('/:id/availability', studyRoomController.getRoomAvailability);
router.post('/', authenticate, authorize('librarian', 'admin'), studyRoomController.createRoom);
router.put('/:id', authenticate, authorize('librarian', 'admin'), studyRoomController.updateRoom);
router.delete('/:id', authenticate, authorize('librarian', 'admin'), studyRoomController.deleteRoom);
router.post('/book', authenticate, authorize('student'), studyRoomController.bookRoom);
router.get('/bookings/my', authenticate, studyRoomController.getUserBookings);
router.get('/bookings', authenticate, authorize('librarian', 'admin'), studyRoomController.getAllBookings);
router.put('/bookings/:id/cancel', authenticate, studyRoomController.cancelBooking);

module.exports = router;
