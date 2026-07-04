const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const Notification = require('../models/Notification');

exports.createReservation = async (req, res, next) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const hasReservation = await Reservation.hasActiveReservation(user_id, book_id);
    if (hasReservation) {
      return res.status(400).json({ message: 'You already have an active reservation for this book.' });
    }

    const reservationId = await Reservation.create({ user_id, book_id });

    if (book.available_quantity > 0) {
      await Notification.create({
        user_id,
        title: 'Reservation Created',
        message: `"${book.title}" is currently available. Please visit the library to borrow it.`,
        type: 'reservation'
      });
    } else {
      await Notification.create({
        user_id,
        title: 'Added to Waiting List',
        message: `You've been added to the waiting list for "${book.title}". You'll be notified when it becomes available.`,
        type: 'reservation'
      });
    }

    res.status(201).json({ message: 'Reservation created.', reservationId });
  } catch (error) {
    next(error);
  }
};

exports.getUserReservations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await Reservation.findByUser(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getAllReservations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await Reservation.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.approveReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    await Reservation.updateStatus(id, 'approved');

    await Notification.create({
      user_id: reservation.user_id,
      title: 'Reservation Approved',
      message: `Your reservation for "${reservation.book_title}" has been approved. Please visit the library.`,
      type: 'reservation'
    });

    res.json({ message: 'Reservation approved.' });
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (reservation.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    await Reservation.updateStatus(id, 'cancelled');

    res.json({ message: 'Reservation cancelled.' });
  } catch (error) {
    next(error);
  }
};
