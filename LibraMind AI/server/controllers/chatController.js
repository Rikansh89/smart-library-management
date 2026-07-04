const { getDatabase } = require('../config/database');
const { chatQuery } = require('../services/geminiService');

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const db = getDatabase();
    const context = {
      libraryName: 'LibraMind AI Library',
      totalBooks: db.prepare('SELECT COUNT(*) as count FROM books WHERE is_active = 1').get().count,
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count,
      availableBooks: db.prepare("SELECT COUNT(*) as count FROM book_copies WHERE status = 'available'").get().count,
      finePerDay: '$0.50',
      maxBorrowLimit: 5,
      borrowDurationDays: 14
    };

    const response = await chatQuery(message, context);

    res.json({ response, timestamp: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
};
