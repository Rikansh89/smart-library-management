const { getDatabase } = require('../config/database');
const { generateQRCode } = require('../services/qrCodeService');
const { getSimilarBooks } = require('../services/geminiService');
const logger = require('../services/loggerService');

exports.addBook = async (req, res, next) => {
  try {
    const {
      isbn, title, author, genre, category, description,
      publisher, published_year, pages, shelf_location, copies
    } = req.body;

    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM books WHERE isbn = ?').get(isbn);

    if (existing) {
      return res.status(400).json({ error: 'Book with this ISBN already exists' });
    }

    const coverImage = req.file ? `/uploads/covers/${req.file.filename}` : null;

    const bookResult = db.prepare(`
      INSERT INTO books (isbn, title, author, genre, category, description, publisher, published_year, pages, cover_image, shelf_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(isbn, title, author, genre || null, category || null, description || null,
      publisher || null, published_year || null, pages || null, coverImage, shelf_location || null);

    const bookId = bookResult.lastInsertRowid;
    const numberOfCopies = parseInt(copies) || 1;

    const copyCodes = [];
    for (let i = 1; i <= numberOfCopies; i++) {
      const copyCode = `${isbn}-C${String(i).padStart(3, '0')}`;
      db.prepare('INSERT INTO book_copies (book_id, copy_code, status, location) VALUES (?, ?, ?, ?)')
        .run(bookId, copyCode, 'available', shelf_location || null);
      copyCodes.push(copyCode);
    }

    for (const copyCode of copyCodes) {
      try {
        await generateQRCode({ bookId, isbn, title, copyCode });
      } catch (qrError) {
        logger.warn(`QR generation failed for ${copyCode}: ${qrError.message}`);
      }
    }

    logger.info(`Book added: ${title} (ISBN: ${isbn}) with ${numberOfCopies} copies`);

    res.status(201).json({
      message: 'Book added successfully',
      book: { id: bookId, isbn, title, author, copies: numberOfCopies }
    });
  } catch (error) {
    next(error);
  }
};

exports.editBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      isbn, title, author, genre, category, description,
      publisher, published_year, pages, shelf_location
    } = req.body;

    const db = getDatabase();
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (isbn && isbn !== book.isbn) {
      const existing = db.prepare('SELECT id FROM books WHERE isbn = ? AND id != ?').get(isbn, id);
      if (existing) {
        return res.status(400).json({ error: 'ISBN already in use by another book' });
      }
    }

    const coverImage = req.file ? `/uploads/covers/${req.file.filename}` : book.cover_image;

    db.prepare(`
      UPDATE books SET isbn = ?, title = ?, author = ?, genre = ?, category = ?,
        description = ?, publisher = ?, published_year = ?, pages = ?,
        cover_image = ?, shelf_location = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      isbn || book.isbn, title || book.title, author || book.author,
      genre || book.genre, category || book.category, description || book.description,
      publisher || book.publisher, published_year || book.published_year,
      pages || book.pages, coverImage, shelf_location || book.shelf_location, id
    );

    logger.info(`Book updated: ID ${id}`);

    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const activeIssues = db.prepare(
      'SELECT COUNT(*) as count FROM issued_books WHERE book_id = ? AND status = ?'
    ).get(id, 'issued');

    if (activeIssues.count > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active issues' });
    }

    db.prepare('UPDATE books SET is_active = 0, updated_at = datetime("now") WHERE id = ?').run(id);
    db.prepare('UPDATE book_copies SET is_active = 0 WHERE book_id = ?').run(id);

    logger.info(`Book deleted (soft): ID ${id}`);

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getBooks = (req, res, next) => {
  try {
    const db = getDatabase();
    const { search, author, genre, category, page = 1, limit = 20 } = req.query;

    let query = 'SELECT b.*, (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id) as total_copies, (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = ?) as available_copies FROM books b WHERE b.is_active = 1';
    const params = ['available'];
    const conditions = [];

    if (search) {
      conditions.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (author) {
      conditions.push('b.author LIKE ?');
      params.push(`%${author}%`);
    }
    if (genre) {
      conditions.push('b.genre = ?');
      params.push(genre);
    }
    if (category) {
      conditions.push('b.category = ?');
      params.push(category);
    }

    if (conditions.length) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY b.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const books = db.prepare(query).all(...params);

    const countQuery = query.replace(/SELECT b\.\*.*FROM books b/, 'SELECT COUNT(*) as total FROM books b')
      .replace(/LIMIT \? OFFSET \?/, '');
    const countParams = params.slice(0, -2);
    const total = db.prepare(countQuery).get(...countParams);

    res.json({ books, total: total.total, page: parseInt(page), totalPages: Math.ceil(total.total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

exports.getBookById = (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const book = db.prepare(`
      SELECT b.*,
        (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id) as total_copies,
        (SELECT COUNT(*) FROM book_copies bc WHERE bc.book_id = b.id AND bc.status = 'available') as available_copies
      FROM books b WHERE b.id = ?
    `).get(id);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const copies = db.prepare('SELECT * FROM book_copies WHERE book_id = ?').all(id);

    res.json({ book, copies });
  } catch (error) {
    next(error);
  }
};

exports.getGenres = (req, res, next) => {
  try {
    const db = getDatabase();
    const genres = db.prepare('SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND is_active = 1 ORDER BY genre').all();
    res.json({ genres: genres.map(g => g.genre) });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = (req, res, next) => {
  try {
    const db = getDatabase();
    const categories = db.prepare('SELECT DISTINCT category FROM books WHERE category IS NOT NULL AND is_active = 1 ORDER BY category').all();
    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    next(error);
  }
};

exports.getSimilarBooks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const allBooks = db.prepare('SELECT * FROM books WHERE is_active = 1 AND id != ?').all(id);
    const similar = await getSimilarBooks(book, allBooks);

    res.json({ books: similar });
  } catch (error) {
    next(error);
  }
};
