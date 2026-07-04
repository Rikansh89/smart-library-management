const IssuedBook = require('../models/IssuedBook');
const Book = require('../models/Book');
const Fine = require('../models/Fine');
const Notification = require('../models/Notification');

exports.requestIssue = async (req, res, next) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    if (book.available_quantity < 1) {
      return res.status(400).json({ message: 'Book not available.' });
    }

    const activeLoans = await IssuedBook.getActiveLoansCount(user_id);
    if (activeLoans >= 5) {
      return res.status(400).json({ message: 'Maximum 5 active loans allowed.' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const issueId = await IssuedBook.create({
      user_id,
      book_id,
      due_date: dueDate,
      issued_by: null
    });

    await Book.update(book_id, { available_quantity: book.available_quantity - 1 });

    res.status(201).json({ message: 'Issue request submitted. Waiting for approval.', issueId });
  } catch (error) {
    next(error);
  }
};

exports.approveIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = await IssuedBook.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue record not found.' });
    }

    await IssuedBook.updateStatus(id, 'issued', req.user.id);
    await Book.incrementBorrowCount(issue.book_id);

    await Notification.create({
      user_id: issue.user_id,
      title: 'Book Issued',
      message: `"${issue.book_title}" has been issued to you. Due date: ${new Date(issue.due_date).toLocaleDateString()}.`,
      type: 'issue'
    });

    res.json({ message: 'Book issued successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.returnBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const issue = await IssuedBook.findById(id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue record not found.' });
    }

    await IssuedBook.updateStatus(id, 'returned', req.user.id);

    const book = await Book.findById(issue.book_id);
    await Book.update(issue.book_id, { available_quantity: book.available_quantity + 1 });

    const dueDate = new Date(issue.due_date);
    const today = new Date();
    const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const fineAmount = diffDays * parseInt(process.env.FINE_PER_DAY || 5);
      await Fine.create({
        user_id: issue.user_id,
        issued_book_id: id,
        amount: fineAmount,
        reason: `Overdue by ${diffDays} days for "${issue.book_title}"`
      });
    }

    await Notification.create({
      user_id: issue.user_id,
      title: 'Book Returned',
      message: `"${issue.book_title}" has been returned successfully.${diffDays > 0 ? ` Fine charged: $${diffDays * parseInt(process.env.FINE_PER_DAY || 5)}` : ''}`,
      type: 'return'
    });

    const Reservation = require('../models/Reservation');
    const nextReservation = await Reservation.getNextInLine(issue.book_id);
    if (nextReservation) {
      await Notification.create({
        user_id: nextReservation.user_id,
        title: 'Book Available',
        message: `"${issue.book_title}" is now available for you. Please visit the library to borrow it.`,
        type: 'reservation'
      });
    }

    res.json({ message: 'Book returned successfully.' });
  } catch (error) {
    next(error);
  }
};

exports.getAllIssues = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await IssuedBook.getAll({
      status: status || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getUserIssues = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await IssuedBook.findByUser(req.user.id, {
      status: status || null,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getIssueById = async (req, res, next) => {
  try {
    const issue = await IssuedBook.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue record not found.' });
    }
    res.json(issue);
  } catch (error) {
    next(error);
  }
};

exports.scanIssue = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.json(book);
  } catch (error) {
    next(error);
  }
};
